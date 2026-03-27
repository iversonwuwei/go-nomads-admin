# Harness Delivery Template

每次 admin 改动默认按以下结构交付：

## 1. Requirement Frame

- 页面或后台动作目标
- 影响的接口、权限、角色、路由和调用方
- 正常路径、失败路径、审计与回滚约束

## 2. Change Plan

- 根因或需求落点
- 最小闭环改动
- 回滚影响面

## 3. Validation

- 已执行的 type check、build、关键后台流程验证
- 未验证角色、数据或页面路径

## 4. Observability

- 关键错误反馈、日志或审计点
- 出问题时如何快速定位

## 5. Delivery Summary

- 已实现
- 已验证
- 剩余风险
- 下一步建议
