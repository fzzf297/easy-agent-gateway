-- Seed classic RuoYi department list API for deptName -> deptId lookup.
-- Idempotent.

INSERT INTO app_interfaces (project_id, code, name, method, path, auth_mode, status, description)
SELECT
    p.id,
    'dept_list',
    '部门列表',
    'POST',
    '/system/dept/list',
    'bearer',
    'enabled',
    '经典 RuoYi 只读部门列表查询'
FROM projects p
WHERE p.code = 'ruoyi-classic'
  AND NOT EXISTS (
      SELECT 1 FROM app_interfaces ai
      WHERE ai.project_id = p.id AND ai.code = 'dept_list'
  );

INSERT INTO interface_configs (interface_id, yaml_text, parsed_json)
SELECT ai.id,
       'version: 1
kind: api
readOnly: true
request:
  method: POST
  path: /system/dept/list
response:
  dataPath: .
auth:
  useProjectAuth: true
',
       '{"version":1,"kind":"api","readOnly":true,"request":{"method":"POST","path":"/system/dept/list"},"response":{"dataPath":"."},"auth":{"useProjectAuth":true}}'
FROM app_interfaces ai
JOIN projects p ON p.id = ai.project_id
WHERE p.code = 'ruoyi-classic' AND ai.code = 'dept_list'
  AND NOT EXISTS (SELECT 1 FROM interface_configs ic WHERE ic.interface_id = ai.id);
