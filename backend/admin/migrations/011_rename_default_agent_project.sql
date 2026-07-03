UPDATE projects
SET
    code = 'easy-agent-gateway-agent',
    name = 'Easy Agent Gateway',
    description = 'Easy Agent Gateway 会话服务与后台配置元数据',
    updated_at = CURRENT_TIMESTAMP
WHERE code = 'ruoyi-ai-agent';
