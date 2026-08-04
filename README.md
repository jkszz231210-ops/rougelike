# 余烬同行（PlayCanvas Roguelite）

一款使用 PlayCanvas Engine、TypeScript 和 Vite 构建的浏览器 2.5D 动作肉鸽原型。

## 当前可玩内容

- 固定斜俯视角竞技场
- WASD 移动、鼠标瞄准、左键攻击、右键技能、Space 闪避
- 五个连续房间：普通战斗、普通战斗、遗物室、精英房、Boss 房
- 可复现的 URL 随机种子
- 经验、等级与房间结束后的随机三选一强化
- 12 项可叠加升级与 6 件单局遗物
- 近战、远程、精英与 Boss 敌人
- 金币、击杀统计与 localStorage 永久统计
- 死亡重开、同种子重试和新种子开局

## 本地运行

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

## 随机种子

游戏首次打开会自动生成 `?seed=...`。复制完整网址即可让其他玩家体验相同的房间数量、生成位置与奖励选项。

## 自动化

- Pull Request 和开发分支会运行 TypeScript 检查与生产构建。
- 合并到 `main` 后，GitHub Pages 工作流会自动发布 `dist`。

## 下一阶段

- 商店、恢复祭坛和随机事件房
- 三名伙伴及协同技能
- 五个主题关卡与最终三阶段 Boss
- 模型、动画、音效与移动端控制
