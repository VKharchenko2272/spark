using System.Collections.Concurrent;

namespace spark.Infrastructure;

/// <summary>
/// Tracks login failures in memory so repeated invalid attempts can trigger a short cooldown.
/// </summary>
public sealed class LoginAttemptProtector
{
    private static readonly TimeSpan FailureWindow = TimeSpan.FromMinutes(10);
    private static readonly TimeSpan CooldownWindow = TimeSpan.FromMinutes(10);
    private const int MaxFailuresBeforeCooldown = 5;
    private readonly ConcurrentDictionary<string, LoginAttemptState> _attempts = new();

    /// <summary>
    /// Returns whether the username and IP pair is currently under a temporary cooldown.
    /// </summary>
    /// <param name="username">The normalized login identifier supplied by the client.</param>
    /// <param name="ipAddress">The client IP address used for partitioning failures.</param>
    /// <returns><see langword="true"/> when the caller should be blocked from another login attempt.</returns>
    public bool IsBlocked(string username, string ipAddress)
    {
        var key = BuildKey(username, ipAddress);
        var now = DateTimeOffset.UtcNow;

        if (!_attempts.TryGetValue(key, out var state))
        {
            return false;
        }

        if (state.BlockedUntil is { } blockedUntil && blockedUntil > now)
        {
            return true;
        }

        if (state.FirstFailureAt + FailureWindow <= now)
        {
            _attempts.TryRemove(key, out _);
        }

        return false;
    }

    /// <summary>
    /// Records a failed login attempt for the supplied username and IP pair.
    /// </summary>
    /// <param name="username">The normalized login identifier supplied by the client.</param>
    /// <param name="ipAddress">The client IP address used for partitioning failures.</param>
    public void RecordFailure(string username, string ipAddress)
    {
        var key = BuildKey(username, ipAddress);
        var now = DateTimeOffset.UtcNow;

        _attempts.AddOrUpdate(
            key,
            _ => new LoginAttemptState(1, now, null),
            (_, current) =>
            {
                if (current.BlockedUntil is { } blockedUntil && blockedUntil > now)
                {
                    return current;
                }

                if (current.FirstFailureAt + FailureWindow <= now)
                {
                    return new LoginAttemptState(1, now, null);
                }

                var nextCount = current.FailureCount + 1;
                DateTimeOffset? nextBlockedUntil = nextCount >= MaxFailuresBeforeCooldown
                    ? now.Add(CooldownWindow)
                    : null;

                return new LoginAttemptState(nextCount, current.FirstFailureAt, nextBlockedUntil);
            });
    }

    /// <summary>
    /// Clears any tracked failures after a successful login.
    /// </summary>
    /// <param name="username">The normalized login identifier supplied by the client.</param>
    /// <param name="ipAddress">The client IP address used for partitioning failures.</param>
    public void RecordSuccess(string username, string ipAddress)
    {
        var key = BuildKey(username, ipAddress);
        _attempts.TryRemove(key, out _);
    }

    private static string BuildKey(string username, string ipAddress)
    {
        var normalizedUsername = username.Trim().ToLowerInvariant();
        var normalizedIp = string.IsNullOrWhiteSpace(ipAddress) ? "unknown" : ipAddress.Trim();
        return $"{normalizedIp}:{normalizedUsername}";
    }

    private sealed record LoginAttemptState(int FailureCount, DateTimeOffset FirstFailureAt, DateTimeOffset? BlockedUntil);
}
