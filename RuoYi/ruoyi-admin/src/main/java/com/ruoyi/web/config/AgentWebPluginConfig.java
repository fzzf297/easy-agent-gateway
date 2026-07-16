package com.ruoyi.web.config;

import java.nio.file.Paths;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Exposes the workspace Agent Web package without copying its build output.
 */
@Configuration
public class AgentWebPluginConfig implements WebMvcConfigurer
{
    @Value("${agent-gateway.plugin-location}")
    private String pluginLocation;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry)
    {
        String resourceLocation = Paths.get(pluginLocation).toAbsolutePath().normalize().toUri().toString();
        registry.addResourceHandler("/frontend/packages/agent-web/dist/**")
                .addResourceLocations(resourceLocation);
    }
}
