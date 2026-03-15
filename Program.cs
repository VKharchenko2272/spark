using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using spark.Models;
using BCrypt.Net; // Correct reference to BCrypt
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http;

var builder = WebApplication.CreateBuilder(args);

// Use the connection string from appsettings.json
builder.Services.AddDbContext<SparkDb>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("sparkdb"),
        ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("sparkdb"))
    ).LogTo(Console.WriteLine, LogLevel.Information));

builder.Services.Configure<Microsoft.AspNetCore.Http.Json.JsonOptions>(options =>
    options.SerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles);

builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/login";
        options.Cookie.HttpOnly = true;
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always; // Consider SecurePolicy to always if using HTTPS
        options.Cookie.SameSite = SameSiteMode.Strict;
        options.Cookie.Name = "MyAppCookie";
        options.ExpireTimeSpan = TimeSpan.FromHours(1); // Session expiration time
        options.SlidingExpiration = true; // Sliding expiration to extend session activity
    });


var myPolicy = "mypolicy";

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: myPolicy, builder => builder
    .AllowAnyOrigin()
    .AllowAnyMethod()
    .AllowAnyHeader());
});

var app = builder.Build();

app.UseCors(myPolicy);

app.MapPost("/login", async (User employee, SparkDb db) =>
{
    var user = await db.user.FirstOrDefaultAsync(u => u.username == employee.username);

    if (user == null)
    {
        return Results.Json(new { success = false, message = "Invalid username or password" });
    }

    try
    {
        // Attempt to verify the password
        bool isPasswordValid = BCrypt.Net.BCrypt.Verify(employee.password ?? "", user.password ?? "");

        if (!isPasswordValid)
        {
            return Results.Json(new { success = false, message = "Invalid username or password" });
        }

        // Check if password needs rehashing due to older or weaker format
        if (!user.password.StartsWith("$2"))
        {
            // Optionally prompt user to change their password
            return Results.Json(new { success = false, message = "Your password needs to be updated for security." });
        }

        bool isAdmin = user.is_admin;
        bool isManager = await db.user.AnyAsync(u => u.manager_id == user.id);

        if (isAdmin)
        {
            isManager = false;  // Set isManager to false

            // Return the appropriate JSON response
            return Results.Json(new
            {
                success = true,
                id = user.id,
                username = user.username,
                isAdmin = isAdmin,
                isManager = isManager
            });
        }
        return Results.Json(new
        {
            success = true,
            id = user.id,
            username = user.username,
            isAdmin = isAdmin,
            isManager = isManager
        });
    }
    catch (SaltParseException)
    {
        // Handle invalid salt error, prompt to rehash
        return Results.Json(new { success = false, message = "Invalid password format. Please reset your password." });
    }
});


app.MapPost("/departments", async (spark.Models.Department dep, SparkDb db) =>
{
    db.department.Add(dep);
    await db.SaveChangesAsync();

    return Results.Created($"/departments/{dep.id}", dep);
});


app.MapGet("/topic", async (SparkDb db) =>
    await db.topic
    .ToListAsync());

// Get all employees
app.MapGet("/employees", async (SparkDb db) =>
    await db.user
    .Include(u => u.department) //adding data about department
    .ToListAsync());

app.MapGet("/users/{id}", async (int id, SparkDb db) =>
{
    var user = await db.user
        .Include(u => u.department) // Include department data
        .FirstOrDefaultAsync(u => u.id == id);

    return user is not null ? Results.Ok(user) : Results.NotFound();
});

app.MapGet("/categories", async (SparkDb db) =>
    await db.category
    // .Include(c => c.topic)
    //     .ThenInclude(t => t.EvaluationOptions)
    .ToListAsync());

app.MapGet("/eval/{id}", async (int id, SparkDb db) =>
{
    var user = await db.user
        .Include(u => u.department) // Include department data
        .FirstOrDefaultAsync(u => u.id == id);

    return user is not null ? Results.Ok(user) : Results.NotFound();
});

app.MapGet("/status/{userId}", async (int userId, SparkDb _context) =>
{
    var oneYearAgo = DateTime.Now.AddYears(-1);

    // Проверка на наличие формы оценки за последний год
    var evaluationForm = await _context.evaluation_form
        .Where(ef => ef.user_id == userId && ef.created >= oneYearAgo)
        .FirstOrDefaultAsync();

    if (evaluationForm != null)
    {
        return Results.Ok(new { status = "Done" });
    }

    return Results.Ok(new { status = "Not Done" });
});

app.MapPost("/evaluate", async (EvaluationRequest formDto, SparkDb _context) =>
{

    // Шаг 1: Create a record in the evaluation_form table
    var evaluationForm = new EvaluationForm
    {
        user_id = formDto.UserId,
        department_id = formDto.DepartmentId,
        manager_id = formDto.ManagerId,
        created = DateTime.Now,
        is_ready = true,
    };

    _context.evaluation_form.Add(evaluationForm);
    await _context.SaveChangesAsync();

    // Getting the ID of the new evaluation_form record for use in other tables ??
    int formId = evaluationForm.id;

    // Шаг 2: Inserting data into the option_evaluation table
    if (formDto != null && formDto.EvaluationOptions != null)
    {
        foreach (var option in formDto.EvaluationOptions)
        {
            var optionEvaluation = new EvaluationOption
            {
                topic_id = option.TopicId,
                comment = option.Comment,
                score = option.Score,
                form_id = formId
            };
            _context.option_evaluation.Add(optionEvaluation);
        }
    }

    // Шаг 3: Inserting comments for categories

    if (formDto != null && formDto.CategoryComments != null)
    {
        foreach (var categoryComment in formDto.CategoryComments)
        {
            var categoryCommentEntity = new CategoryComment
            {
                category_id = categoryComment.CategoryId,
                comment = categoryComment.Comment,
                form_id = formId // We use the received formId
            };
            _context.category_comment.Add(categoryCommentEntity);

        }
    }
    // We save all changes to the database
    await _context.SaveChangesAsync();

    return Results.Ok(new { message = "Evaluation form created successfully!" });
});

// Get evaluations and scores for all users in a department
app.MapGet("/dep-rating/{departmentId}", async (int departmentId, SparkDb _context) =>
{
    // Query all evaluation forms within the department
    var evaluations = await _context.evaluation_form
        .Include(ef => ef.EvaluationOptions)
            .ThenInclude(eo => eo.Topic)
        .Where(ef => ef.department_id == departmentId)
        .ToListAsync();

    if (evaluations == null || !evaluations.Any())
    {
        return Results.NotFound(new { message = "No evaluations found for the department." });
    }

    // Group the data by category and topic
    var categoryScores = evaluations
        .SelectMany(ef => ef.EvaluationOptions)
        .GroupBy(eo => eo.Topic.category_id)
        .Select(group => new
        {
            category_id = group.Key,
            topics = group.GroupBy(eo => eo.Topic.id)
                          .Select(topicGroup => new
                          {
                              topic_id = topicGroup.Key,
                              average_score = topicGroup.Average(eo => eo.score)
                          }).ToList(),
            total_score = group.Sum(eo => eo.score)
        }).ToList();

    var response = new
    {
        departmentId = departmentId,
        categories = categoryScores
    };

    return Results.Ok(response);
});

app.MapGet("/rating/{userId}", async (int userId, SparkDb _context) =>
{
    var oneYearAgo = DateTime.Now.AddYears(-1);

    var evaluationForm = await _context.evaluation_form
        .Include(ef => ef.EvaluationOptions)
            .ThenInclude(eo => eo.Topic)
        .Include(ef => ef.CategoryComments)
        .Where(ef => ef.user_id == userId && ef.created >= oneYearAgo)
        .OrderByDescending(ef => ef.created)
        .FirstOrDefaultAsync();

    if (evaluationForm == null)
    {
        return Results.NotFound(new { message = "Evaluation form not found or too old." });
    }

    var categories = evaluationForm.EvaluationOptions
    .GroupBy(eo => eo.Topic.category_id)
    .Select(group => new
    {
        category_id = group.Key,
        topics = group.Select(eo => new
        {
            eo.Topic.id,
            eo.score
        }).ToList(),
        total_score = group.Sum(eo => eo.score)
    }).ToList();

    var response = new
    {
        evaluationForm.id,
        evaluationForm.user_id,
        evaluationForm.created,
        Categories = categories
    };

    return Results.Ok(response);
});

app.MapGet("/evaluate/user/{userId}", async (int userId, SparkDb _context) =>
{
    // Определяем текущую дату и дату год назад
    var oneYearAgo = DateTime.Now.AddYears(-1);

    // Находим форму оценки по userId и проверяем дату создания
    var evaluationForm = await _context.evaluation_form
        .Include(ef => ef.EvaluationOptions)
            .ThenInclude(eo => eo.Topic)
        .Include(ef => ef.User)
        .Include(ef => ef.CategoryComments)
        .Where(ef => ef.user_id == userId && ef.created >= oneYearAgo)
        .OrderByDescending(ef => ef.created) // На случай, если нужно выбрать самую последнюю форму
        .FirstOrDefaultAsync();

    if (evaluationForm == null)
    {
        return Results.NotFound(new { message = "Evaluation form not found or too old." });
    }

    // Подготовка ответа
    var response = new
    {
        evaluationForm.id,
        evaluationForm.user_id,
        evaluationForm.department_id,
        evaluationForm.manager_id,
        evaluationForm.created,
        evaluationForm.is_ready,
        EvaluationOptions = evaluationForm.EvaluationOptions.Select(eo => new
        {
            eo.id,
            Topic = eo.Topic == null ? null : new
            {
                eo.Topic.id,
                eo.Topic.category_id,
            },
            eo.comment,
            eo.score
        }).ToList(),
        CategoryComments = evaluationForm.CategoryComments.Select(cc => new
        {
            cc.id,
            cc.category_id,
            cc.comment
        }).ToList()
    };

    return Results.Ok(response);
});

app.MapPost("/employees-with-image", async (HttpRequest request, SparkDb db) =>
{
    var form = await request.ReadFormAsync();
    var user = new User
    {
        firstname = form["firstname"],
        lastname = form["lastname"],
        email = form["email"],
        username = form["username"],
        company_role = form["company_role"],
        is_admin = bool.TryParse(form["is_admin"], out bool isAdmin) ? isAdmin : false,
        hired_date = DateTime.TryParse(form["hired_date"], out DateTime hiredDate) ? hiredDate : (DateTime?)null,
        manager_id = int.TryParse(form["manager_id"], out int managerId) ? managerId : (int?)null,
        department_id = int.TryParse(form["department_id"], out int departmentId) ? departmentId : (int?)null
    };

    // Validate department_id
    if (user.department_id != null)
    {
        var department = await db.department.FindAsync(user.department_id);
        if (department == null)
        {
            return Results.BadRequest("Invalid department ID.");
        }
    }

    // Hash the password using BCrypt
    if (!string.IsNullOrWhiteSpace(form["password"]))
    {
        user.password = BCrypt.Net.BCrypt.HashPassword(form["password"]);
    }
    else
    {
        return Results.BadRequest("Password is required.");
    }

    // Process the file upload
    var file = form.Files["image"];
    if (file != null && file.Length > 0)
    {
        using (var memoryStream = new MemoryStream())
        {
            await file.CopyToAsync(memoryStream);
            user.img = memoryStream.ToArray();  // Convert image to byte array
        }
    }

    db.user.Add(user);
    await db.SaveChangesAsync();

    return Results.Created($"/employees/{user.id}", new
    {
        id = user.id,
        username = user.username,
        firstname = user.firstname,
        lastname = user.lastname
    });
});

app.MapGet("/images/{id}", async (int id, SparkDb db) =>
{
    var user = await db.user.FindAsync(id);
    if (user == null || user.img == null)
    {
        return Results.NotFound();
    }
    return Results.File(user.img, "image/jpeg");  // Adjust content type as needed
});
app.MapGet("/departments", async (SparkDb db) =>
    await db.department.ToListAsync());

app.MapPut("/users/{id}", async (int id, spark.Models.User editEmployee, SparkDb db) =>
{
    // Find the existing employee in the database
    var employee = await db.user.FindAsync(id);
    // If employee not found, return 404 Not Found
    if (employee is null) return Results.NotFound();
    // Optional: Add validation for the incoming editEmployee data
    if (editEmployee == null) return Results.BadRequest("Invalid data.");
    // Update fields if they are provided
    if (!string.IsNullOrEmpty(editEmployee.firstname))
        employee.firstname = editEmployee.firstname;
    if (!string.IsNullOrEmpty(editEmployee.lastname))
        employee.lastname = editEmployee.lastname;
    if (!string.IsNullOrEmpty(editEmployee.email))
        employee.email = editEmployee.email;
    if (!string.IsNullOrEmpty(editEmployee.company_role))
        employee.company_role = editEmployee.company_role;
    employee.department_id = editEmployee.department_id;
    employee.hired_date = editEmployee.hired_date;
    await db.SaveChangesAsync();
    return Results.NoContent();
});

app.MapPut("/employees/{id}", async (int id, spark.Models.User inputEmployee, SparkDb db) =>
{
    var employee = await db.user.FindAsync(id);

    if (employee is null) return Results.NotFound();

    employee.firstname = inputEmployee.firstname;
    employee.lastname = inputEmployee.lastname;
    employee.email = inputEmployee.email;
    employee.company_role = inputEmployee.company_role;
    employee.is_admin = inputEmployee.is_admin;

    await db.SaveChangesAsync();

    return Results.NoContent();
});

app.MapDelete("/employees/{id}", async (int id, SparkDb db) =>
{
    // Retrieve the user from the database
    var employee = await db.user.FindAsync(id);
    if (employee == null)
    {
        return Results.NotFound(new { message = "User not found." });
    }

    // Check for dependent records (example: direct reports)
    var hasDependents = await db.user.AnyAsync(u => u.manager_id == id);
    if (hasDependents)
    {
        return Results.BadRequest(new { message = "Cannot delete user because they have dependent records." });
    }

    // Use a transaction for safe deletion
    using (var transaction = await db.Database.BeginTransactionAsync())
    {
        try
        {
            db.user.Remove(employee);
            await db.SaveChangesAsync();

            // Commit the transaction if successful
            await transaction.CommitAsync();

            return Results.Ok(new { message = "User deleted successfully." });
        }
        catch (Exception ex)
        {
            // Log the error or handle it appropriately here
            var errorResponse = new { message = "An error occurred while deleting the user.", error = ex.Message };

            return Results.Json(errorResponse, statusCode: 500);
        }
    }
});


app.MapGet("/department-scores/{managerId}", async (int managerId, SparkDb _context) =>
{
    try
    {
        List<User> users;

        if (managerId == 1)
        {
            // Администратор (id = 1) — выбираем всех пользователей, кроме пользователя с id = 1
            users = await _context.user
                .Where(u => u.id != 1) // Исключаем администратора
                .ToListAsync();
        }
        else
        {
            // Менеджер — выбираем только тех пользователей, у которых manager_id соответствует managerId
            users = await _context.user
                .Where(u => u.manager_id == managerId) // Выбираем пользователей под управлением этого менеджера
                .ToListAsync();
        }
        // Если пользователи не найдены, возвращаем 404 Not Found
        if (users == null || !users.Any())
        {
            return Results.NotFound(new { message = "No users found for the manager." });
        }

        // Получаем id всех пользователей
        var userIds = users.Select(u => u.id).ToList();

        // Извлекаем формы оценки для найденных пользователей
        var evaluations = await _context.evaluation_form
            .Include(ef => ef.EvaluationOptions)
                .ThenInclude(eo => eo.Topic)
            .Where(ef => userIds.Contains(ef.user_id))
            .ToListAsync();

        // Если оценки не найдены, возвращаем 404 Not Found
        if (evaluations == null || !evaluations.Any())
        {
            return Results.NotFound(new { message = "No evaluations found for the manager's users." });
        }

        // Группируем оценки по категориям и темам
        var categoryScores = evaluations
            .SelectMany(ef => ef.EvaluationOptions)
            .GroupBy(eo => eo.Topic.category_id)
            .Select(categoryGroup => new
            {
                category_id = categoryGroup.Key,
                topics = categoryGroup.GroupBy(eo => eo.Topic.id)
                                      .Select(topicGroup => new
                                      {
                                          topic_id = topicGroup.Key,
                                          average_score = topicGroup.Average(eo => eo.score)
                                      }).ToList(),
                total_score = categoryGroup.Sum(eo => eo.score)
            }).ToList();

        // Формируем ответ
        var response = new
        {
            managerId = managerId,
            categories = categoryScores
        };

        return Results.Ok(response);
    }
    catch (Exception ex)
    {
        // Логируем исключение и возвращаем 500 Internal Server Error
        Console.WriteLine($"Error fetching manager scores: {ex.Message}");
        return Results.Problem("An error occurred while processing the request.");
    }
});



app.MapGet("/manager-user-scores/{managerId}", async (int managerId, SparkDb _context) =>
{
    try
    {
        List<User> users;

        if (managerId == 1)
        {
            // Администратор (id = 1) — выбираем всех пользователей, кроме пользователя с id = 1
            users = await _context.user
                .Where(u => u.id != 1) // Исключаем администратора
                .ToListAsync();
        }
        else
        {
            // Менеджер — выбираем только тех пользователей, у которых manager_id соответствует managerId
            users = await _context.user
                .Where(u => u.manager_id == managerId) // Выбираем пользователей под управлением этого менеджера
                .ToListAsync();
        }
        // If no users are found, return a 404 Not Found
        if (users == null || !users.Any())
        {
            return Results.NotFound(new { message = "No users found for the manager." });
        }

        // Extract user IDs
        var userIds = users.Select(u => u.id).ToList();

        // Retrieve evaluation forms for the found users
        var evaluations = await _context.evaluation_form
            .Include(ef => ef.EvaluationOptions)
                .ThenInclude(eo => eo.Topic)
            .Where(ef => userIds.Contains(ef.user_id))
            .ToListAsync();

        // If no evaluations are found, return a 404 Not Found
        if (evaluations == null || !evaluations.Any())
        {
            return Results.NotFound(new { message = "No evaluations found for the manager's users." });
        }

        // Create a response with user names, scores by topic, and total score
        var userScores = evaluations
            .SelectMany(ef => ef.EvaluationOptions, (ef, eo) => new
            {
                UserId = ef.user_id,
                UserName = users.First(u => u.id == ef.user_id).firstname,
                UserLastName = users.First(u => u.id == ef.user_id).lastname,
                TopicId = eo.Topic.id,
                Score = eo.score
            })
            .GroupBy(us => new { us.UserId, us.UserName, us.UserLastName })
            .Select(userGroup => new
            {
                UserId = userGroup.Key.UserId,
                UserName = userGroup.Key.UserName,
                UserLastName = userGroup.Key.UserLastName,
                Topics = userGroup.Select(ug => new
                {
                    TopicId = ug.TopicId,
                    Score = ug.Score
                }).ToList(),
                // Calculate the total score by summing the scores for each user
                TotalScore = userGroup.Sum(ug => ug.Score)
            })
            .ToList();

        return Results.Ok(userScores);
    }
    catch (Exception ex)
    {
        // Log the exception and return a 500 Internal Server Error
        Console.WriteLine($"Error fetching user scores: {ex.Message}");
        return Results.Problem("An error occurred while processing the request.");
    }
});

app.MapPut("/edit/{id}", async (HttpRequest request, int id, SparkDb db) =>
{
    // Find the existing employee in the database
    var employee = await db.user.FindAsync(id);

    // If employee not found, return 404 Not Found
    if (employee is null) return Results.NotFound();

    // Read the form data
    var form = await request.ReadFormAsync();

    // Optional: Validate form data
    if (form == null) return Results.BadRequest("Invalid data.");

    // Update fields if they are provided
    if (form.ContainsKey("firstname") && !string.IsNullOrEmpty(form["firstname"]))
        employee.firstname = form["firstname"];

    if (form.ContainsKey("lastname") && !string.IsNullOrEmpty(form["lastname"]))
        employee.lastname = form["lastname"];

    if (form.ContainsKey("email") && !string.IsNullOrEmpty(form["email"]))
        employee.email = form["email"];

    if (form.ContainsKey("username") && !string.IsNullOrEmpty(form["username"]))
        employee.username = form["username"];

    if (form.ContainsKey("password") && !string.IsNullOrEmpty(form["password"]))
        employee.password = BCrypt.Net.BCrypt.HashPassword(form["password"]); // Consider hashing the password before saving
    else
    {
        return Results.BadRequest("Password is required.");
    }

    if (form.ContainsKey("company_role") && !string.IsNullOrEmpty(form["company_role"]))
        employee.company_role = form["company_role"];

    if (form.ContainsKey("is_admin") && bool.TryParse(form["is_admin"], out bool isAdmin))
        employee.is_admin = isAdmin;

    if (form.ContainsKey("hired_date") && DateTime.TryParse(form["hired_date"], out DateTime hiredDate))
        employee.hired_date = hiredDate;

    if (form.ContainsKey("manager_id") && int.TryParse(form["manager_id"], out int managerId))
        employee.manager_id = managerId;

    if (form.ContainsKey("department_id") && int.TryParse(form["department_id"], out int departmentId))
    {
        // Validate department_id
        var department = await db.department.FindAsync(departmentId);
        if (department == null)
        {
            return Results.BadRequest("Invalid department ID.");
        }
        employee.department_id = departmentId;
    }

    // Process the file upload if provided
    var file = form.Files["image"];
    if (file != null && file.Length > 0)
    {
        using (var memoryStream = new MemoryStream())
        {
            await file.CopyToAsync(memoryStream);
            employee.img = memoryStream.ToArray(); // Convert image to byte array
        }
    }

    // Save changes to the database
    await db.SaveChangesAsync();

    // Optionally, return the updated resource
    return Results.NoContent(); // or Results.Ok(employee) if you want to return the updated resource
});

app.Run();