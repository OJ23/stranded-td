# Stranded ship interior movement

## Goal

Add one playable 3D corridor to Stranded on `feature/ship-movement`. The player can walk to the bridge door, press **E**, and trigger the existing story rules. Start with desktop first-person controls and placeholder geometry.

## Before editing

- Work in the existing `stranded-td` checkout. Confirm the active branch with `git branch --show-current`.
- Locate the React scene renderer, story state, and existing choice or interaction handlers. Check the package manifest for Three.js and reuse any compatible 3D setup already present.
- Mount the corridor in one existing ship scene. If the bridge door or power condition uses different names in the story data, use the existing IDs and rules. If the story has no equivalent, keep the example interaction isolated to the corridor and document the assumption.

## Implementation

1. **Mount the scene in React.** Add a corridor component that owns the Three.js canvas, camera, renderer, and animation loop. Keep the dialogue and interaction prompt in React. Size the renderer and update the camera aspect ratio when the container changes. Keep per-frame positions and key state in the scene instead of putting them in React state.
2. **Build a walkable corridor.** Start with a floor, walls, lighting, and a bridge door made from simple geometry. Set a spawn point clear of walls. Use a small player radius and box boundaries for walls and the door. Check movement along each horizontal axis so the player can slide along a wall. Clamp large time steps and use substeps if needed to prevent crossing thin walls.
3. **Add first-person controls.** Use WASD for horizontal movement relative to camera yaw. Normalize diagonal input and scale movement by elapsed time. Enable mouse look after an explicit click in the scene, clamp vertical look, and clear held keys on blur or when the player exits mouse capture. Suspend controls while a blocking dialogue or menu is open.
4. **Connect the bridge door to the story.** Show **Press E** within a short interaction distance and on the corridor side of the door. On a fresh key press, pass an interaction ID such as `bridge-door` to React. React checks the current story state and either shows the locked-door message or runs the existing transition. For the example, a door without power stays locked and says “The door has no power.” Keep the power flag and progression in the existing story state.
5. **Clean up on exit.** Cancel the frame loop, remove input and resize handlers, release mouse capture if the scene owns it, and dispose of scene-owned Three.js resources when React unmounts the corridor. Reentering the scene should mount one canvas and register one set of controls.

## Acceptance checks

- [ ] The corridor opens through the normal story flow and displays its React UI.
- [ ] WASD moves the player relative to where they face. Diagonal movement uses the same speed as forward movement.
- [ ] The player cannot walk through walls or the closed bridge door.
- [ ] The interaction prompt appears within reach. Pressing **E** from farther away does nothing, and holding it triggers at most one interaction per press.
- [ ] With power off, interacting shows the locked-door message. With power restored, it triggers the intended story transition.
- [ ] Leaving and reentering the corridor produces one canvas, responsive controls, and no duplicate interaction events.
- [ ] Run the repository’s existing build and any relevant lint or test commands. Report the commands and any checks that still need manual verification.

## Follow-up work

- **Visible player animation.** If the game uses a visible avatar later, load a rigged `.glb` and blend idle and walk clips with `AnimationMixer`. Select the clip using actual movement after collision checks so walking into a wall does not keep the walk cycle active.
- **Ship rocking.** Animate a parent group for a cinematic view of the ship. For an interior view where the camera and cabin rotate together, use an exterior reference such as stars through a window to make the motion visible.
