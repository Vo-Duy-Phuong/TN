using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;

namespace QLK.Infrastructure.Security;

public class PermissionPolicyProvider : IAuthorizationPolicyProvider
{
    public DefaultAuthorizationPolicyProvider FallbackPolicyProvider { get; }

    public PermissionPolicyProvider(IOptions<AuthorizationOptions> options)
    {
        FallbackPolicyProvider = new DefaultAuthorizationPolicyProvider(options);
    }

    public Task<AuthorizationPolicy> GetDefaultPolicyAsync() => FallbackPolicyProvider.GetDefaultPolicyAsync();

    public Task<AuthorizationPolicy?> GetFallbackPolicyAsync() => FallbackPolicyProvider.GetFallbackPolicyAsync();

    public async Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
    {
        var policy = await FallbackPolicyProvider.GetPolicyAsync(policyName);
        if (policy != null)
        {
            return policy;
        }

        // Treat any other policy name as a permission (e.g., "Users.View", "Products.Create")
        var builder = new AuthorizationPolicyBuilder();
        builder.AddRequirements(new PermissionRequirement(policyName));
        return builder.Build();
    }
}
