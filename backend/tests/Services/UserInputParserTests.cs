using Microsoft.AspNetCore.Http;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using spark.Infrastructure;
using Xunit;

namespace spark.Tests.Services;

public sealed class UserInputParserTests
{
    [Fact]
    public async Task ReadImageAsync_AcceptsValidPngBytes()
    {
        var bytes = await CreatePngAsync(16, 16);
        var file = CreateFormFile(bytes, "avatar.png", "image/png");

        var result = await UserInputParser.ReadImageAsync(file, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(bytes, result);
    }

    [Fact]
    public async Task ReadImageAsync_RejectsSpoofedImageContent()
    {
        var fakeBytes = new byte[] { 0x74, 0x65, 0x78, 0x74 };
        var file = CreateFormFile(fakeBytes, "avatar.png", "image/png");

        var exception = await Assert.ThrowsAsync<ApiException>(() => UserInputParser.ReadImageAsync(file, CancellationToken.None));

        Assert.Equal(StatusCodes.Status400BadRequest, exception.StatusCode);
    }

    [Fact]
    public async Task ReadImageAsync_RejectsOversizedDimensions()
    {
        var bytes = await CreatePngAsync(5000, 32);
        var file = CreateFormFile(bytes, "wide-avatar.png", "image/png");

        var exception = await Assert.ThrowsAsync<ApiException>(() => UserInputParser.ReadImageAsync(file, CancellationToken.None));

        Assert.Equal(StatusCodes.Status400BadRequest, exception.StatusCode);
        Assert.Contains("4096x4096", exception.Message, StringComparison.Ordinal);
    }

    private static IFormFile CreateFormFile(byte[] bytes, string fileName, string contentType)
    {
        var stream = new MemoryStream(bytes);
        return new FormFile(stream, 0, bytes.Length, "image", fileName)
        {
            Headers = new HeaderDictionary(),
            ContentType = contentType,
        };
    }

    private static async Task<byte[]> CreatePngAsync(int width, int height)
    {
        using var image = new Image<Rgba32>(width, height);
        await using var stream = new MemoryStream();
        await image.SaveAsPngAsync(stream);
        return stream.ToArray();
    }
}
