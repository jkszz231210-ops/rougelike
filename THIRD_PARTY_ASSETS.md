# Third-party runtime assets

Emberfall V0.5 loads the following public KayKit assets at runtime through jsDelivr. They are intentionally kept external so the repository stays lightweight while the real-model pipeline is being validated.

## KayKit Character Pack: Adventurers

- Source: https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0
- Creator: Kay Lousberg / KayKit
- License: Creative Commons Zero (CC0 1.0 Universal)
- Usage in this project: Knight, Rogue_Hooded, Barbarian and Mage GLB character assets.

## KayKit Character Pack: Skeletons

- Source: https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Skeletons-1.0
- Creator: Kay Lousberg / KayKit
- License: Creative Commons Zero (CC0 1.0 Universal)
- Usage in this project: Skeleton_Minion, Skeleton_Rogue and Skeleton_Warrior GLB character assets.

## KayKit Dungeon Remastered

- Source: https://github.com/KayKit-Game-Assets/KayKit-Dungeon-Remastered-1.0
- Creator: Kay Lousberg / KayKit
- License: Creative Commons Zero (CC0 1.0 Universal)
- Active usage: modular pillar, decorated pillar, lit torch, gated wall, patterned banner and chest GLB props used across the ten-room environment progression.
- Runtime fallback: each remote prop keeps a lightweight procedural stand-in until the GLB has loaded, and retains the fallback if loading fails.

Attribution is not required by the source license. This file is retained for provenance, auditing and future asset-pipeline maintenance.
