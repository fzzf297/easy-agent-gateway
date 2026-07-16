package com.ruoyi.web.controller.common;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashSet;
import java.util.Set;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.HandlerMapping;

/**
 * Same-origin proxy for the Easy Agent Gateway browser component.
 */
@Controller
public class AgentGatewayProxyController
{
    private static final String PROXY_PREFIX = "/agent-gateway-proxy";

    private static final Set<String> REQUEST_HEADERS_TO_SKIP = new HashSet<>();

    private static final Set<String> RESPONSE_HEADERS_TO_SKIP = new HashSet<>();

    static
    {
        Collections.addAll(REQUEST_HEADERS_TO_SKIP, "host", "content-length", "connection");
        Collections.addAll(RESPONSE_HEADERS_TO_SKIP, "transfer-encoding", "content-length", "connection");
    }

    @Value("${agent-gateway.backend-url}")
    private String backendUrl;

    @RequestMapping("/agent-gateway-proxy/**")
    public void forward(HttpServletRequest request, HttpServletResponse response) throws Exception
    {
        String path = (String) request.getAttribute(HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE);
        String target = backendUrl.replaceAll("/+$", "") + path.substring(PROXY_PREFIX.length());
        if (request.getQueryString() != null)
        {
            target += "?" + request.getQueryString();
        }

        HttpURLConnection connection = (HttpURLConnection) new URL(target).openConnection();
        connection.setRequestMethod(request.getMethod());
        connection.setInstanceFollowRedirects(false);
        copyRequestHeaders(request, connection);
        connection.setDoInput(true);

        if (request.getContentLengthLong() > 0)
        {
            connection.setDoOutput(true);
            copy(request.getInputStream(), connection.getOutputStream());
        }

        response.setStatus(connection.getResponseCode());
        copyResponseHeaders(connection, response);
        InputStream input = connection.getErrorStream();
        if (input == null)
        {
            input = connection.getInputStream();
        }
        if (input != null)
        {
            copy(input, response.getOutputStream());
        }
        response.flushBuffer();
    }

    private void copyRequestHeaders(HttpServletRequest request, HttpURLConnection connection)
    {
        Enumeration<String> names = request.getHeaderNames();
        while (names.hasMoreElements())
        {
            String name = names.nextElement();
            if (!REQUEST_HEADERS_TO_SKIP.contains(name.toLowerCase()))
            {
                connection.setRequestProperty(name, request.getHeader(name));
            }
        }
    }

    private void copyResponseHeaders(HttpURLConnection connection, HttpServletResponse response)
    {
        for (int index = 1; ; index++)
        {
            String name = connection.getHeaderFieldKey(index);
            if (name == null)
            {
                break;
            }
            if (!RESPONSE_HEADERS_TO_SKIP.contains(name.toLowerCase()))
            {
                response.addHeader(name, connection.getHeaderField(index));
            }
        }
    }

    private void copy(InputStream input, OutputStream output) throws Exception
    {
        try (InputStream source = input; OutputStream target = output)
        {
            byte[] buffer = new byte[8192];
            int length;
            while ((length = source.read(buffer)) != -1)
            {
                target.write(buffer, 0, length);
                target.flush();
            }
        }
    }
}
