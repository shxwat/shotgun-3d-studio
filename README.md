# 12-Gauge Pump-Action Shotgun — Procedural Three.js Reconstruction

A code-only, procedural Three.js reconstruction of a realistic **12-Gauge Pump-Action Shotgun** based on the reference image. No downloaded 3D mesh files, no external art assets — built using a JSON `ObjectSculptSpec`, generated TypeScript model factory, and procedural CanvasTextures.

## Result

The full staged 3D reconstruction features:
- **Matte Black Synthetic Stock & Grip**: Ergonomically shaped buttstock with cheek rest ridge, wrist grip, and grooved rubber recoil pad.
- **Blued Anodized Steel Receiver**: Machined metallic receiver with ejection port, silver bolt carrier, receiver pin rivets, and trigger guard loop.
- **Ventilated Barrel & Sight Line**: 1.65m steel smoothbore barrel with a top ventilated sight rib featuring 14 cooling slots and front bead sight.
- **Ribbed Forend Pump Handle**: Synthetic pump handle with 14 ergonomic grip rings, animated sliding back along the magazine tube.
- **Under-Barrel Magazine Tube**: Lower steel tubular magazine with knurled magazine cap and barrel clamp.
- **Polished Chrome & Gold Ammunition**: Silver trigger blade and red plastic 12-gauge shotgun shell with brass rim.

See `renders/FINAL_hero.png` and `renders/FINAL_side.png`.

## View & Run

```bash
cd /Users/shashwat/Desktop/shotGun
npm run dev            # Vite dev server at http://localhost:5173
```

Open in browser:
- `http://localhost:5173/?mode=hero` — Interactive Studio (3-Point Studio Lighting, Ground Shadows, Orbit Controls, Firing, Pump Racking, Disassembly FX, Material Finishes)
- `http://localhost:5173/?mode=eval` — Evaluation View (Flat White, Orthographic Side View)

## Finishes / Presets

1. **Tactical Black** (Default): Matte synthetic polymer stock & pump + blued steel receiver/barrel + chrome trigger.
2. **Walnut Wood**: Classic rich walnut grain stock & forend + polished blued steel + gold trigger.
3. **FDE Tan**: Flat Dark Earth tactical polymer + dark steel accents.
4. **Midnight Chrome**: Mirror chrome receiver & metallic accents + deep black synthetic stock.

## Interactive Controls

- **Disassemble (E)**: 3D exploded view of sub-assemblies with shockwave & crystal particle FX.
- **Fire (Space)**: Muzzle flash flare, pump racking, screen shake, and shell eject animation.
- **Rack Pump**: Manual pump slide racking animation.
- **Reload Shell (R)**: Ammunition loading sequence.
- **Camera Angles**: Hero, Side, Muzzle, Pump detail view.
