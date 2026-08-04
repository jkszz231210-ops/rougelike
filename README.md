# 余烬同行（rougelike）

基于 PlayCanvas Engine、TypeScript 和 Vite 的浏览器 2.5D 动作肉鸽原型。

## 当前可玩内容

- 固定斜俯视角竞技场
- WASD 移动、鼠标瞄准
- 左键普通攻击、右键范围技能、Space 闪避
- 近战敌人、远程敌人和第一关 Boss
- 三选一强化
- 生命、冷却、波次 HUD
- 死亡重开与通关结算

## 本地运行

```bash
npm install
npm run dev
```

构建检查：

```bash
npm run build
```

## 发布

`main` 分支通过 GitHub Actions 自动构建并发布到 GitHub Pages。仓库设置中需要将 Pages Source 设置为 **GitHub Actions**。

## 开发状态

当前处于第一关可玩竖切阶段。详细设计见 [GAME_DESIGN.md](./GAME_DESIGN.md)。
