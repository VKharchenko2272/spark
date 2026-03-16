using spark.Dtos.Common;

namespace spark.Infrastructure;

public sealed class ApiException : Exception
{
    public ApiException(int statusCode, string message)
        : base(message)
    {
        StatusCode = statusCode;
    }

    public int StatusCode { get; }

    public static ApiException BadRequest(string message) => new(StatusCodes.Status400BadRequest, message);
    public static ApiException Unauthorized(string message) => new(StatusCodes.Status401Unauthorized, message);
    public static ApiException Forbidden(string message) => new(StatusCodes.Status403Forbidden, message);
    public static ApiException NotFound(string message) => new(StatusCodes.Status404NotFound, message);
    public static ApiException Conflict(string message) => new(StatusCodes.Status409Conflict, message);
    public static ApiException TooManyRequests(string message) => new(StatusCodes.Status429TooManyRequests, message);
    public static ApiException Internal(string message) => new(StatusCodes.Status500InternalServerError, message);
}

public static class ApiExceptionExtensions
{
    public static async Task WriteAsJsonAsync(this HttpContext context, ApiException exception)
    {
        context.Response.StatusCode = exception.StatusCode;
        await context.Response.WriteAsJsonAsync(new ApiMessageDto(exception.Message));
    }
}
