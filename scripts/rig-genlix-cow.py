"""Create a reusable quadruped rig and idle animation for the Genlix cow."""

import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


def script_args() -> list[str]:
    if "--" not in sys.argv:
        return []
    return sys.argv[sys.argv.index("--") + 1 :]


args = script_args()
source_path = Path(args[0]) if args else Path(
    "/Users/jackkor/Downloads/4ac34d70-0730-4d78-abc9-101d4ff7ab88.glb"
)
output_dir = Path(args[1]) if len(args) > 1 else Path(
    "/Users/jackkor/Documents/GENLIX/public/models"
)
preview_dir = Path(args[2]) if len(args) > 2 else Path(
    "/private/tmp/genlix-cow-rig-preview"
)
editable_dir = Path(args[3]) if len(args) > 3 else Path(
    "/Users/jackkor/Documents/GENLIX/assets/3d"
)
output_dir.mkdir(parents=True, exist_ok=True)
preview_dir.mkdir(parents=True, exist_ok=True)
editable_dir.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source_path))

mesh_objects = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
if len(mesh_objects) != 1:
    raise RuntimeError(f"Expected one cow mesh, found {len(mesh_objects)}")

cow = mesh_objects[0]
cow.name = "Genlix_Cow"
cow.data.name = "Genlix_Cow_Mesh"
bpy.context.view_layer.objects.active = cow
cow.select_set(True)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

coordinate_ranges = {
    axis: (
        min(vertex.co[index] for vertex in cow.data.vertices),
        max(vertex.co[index] for vertex in cow.data.vertices),
    )
    for index, axis in enumerate(("X", "Y", "Z"))
}
print(f"Cow coordinate ranges: {coordinate_ranges}")
for label, predicate in (
    ("negative_y_end", lambda coordinate: coordinate.y < -0.70),
    ("positive_y_end", lambda coordinate: coordinate.y > 0.70),
):
    points = [vertex.co for vertex in cow.data.vertices if predicate(vertex.co)]
    print(
        label,
        len(points),
        {
            axis: (
                min(point[index] for point in points),
                max(point[index] for point in points),
            )
            for index, axis in enumerate(("X", "Y", "Z"))
        },
    )

for material_slot in cow.material_slots:
    material = material_slot.material
    if not material or not material.use_nodes:
        continue
    principled = material.node_tree.nodes.get("Principled BSDF")
    if principled and "Emission Strength" in principled.inputs:
        principled.inputs["Emission Strength"].default_value = 0.0

armature_data = bpy.data.armatures.new("Genlix_Cow_Rig")
armature = bpy.data.objects.new("Genlix_Cow_Rig", armature_data)
bpy.context.collection.objects.link(armature)
armature.show_in_front = True
armature.data.display_type = "OCTAHEDRAL"

bpy.context.view_layer.objects.active = armature
armature.select_set(True)
bpy.ops.object.mode_set(mode="EDIT")


def add_bone(
    name: str,
    head: tuple[float, float, float],
    tail: tuple[float, float, float],
    parent: str | None = None,
    connected: bool = False,
    deform: bool = True,
) -> None:
    bone = armature.data.edit_bones.new(name)
    bone.head = head
    bone.tail = tail
    bone.use_deform = deform
    if parent:
        bone.parent = armature.data.edit_bones[parent]
        bone.use_connect = connected


add_bone("Root", (0.0, 0.0, -0.57), (0.0, 0.0, -0.37), deform=False)
add_bone("Pelvis", (0.0, 0.47, 0.10), (0.0, 0.16, 0.14), "Root")
add_bone("Spine", (0.0, 0.16, 0.14), (0.0, -0.14, 0.17), "Pelvis", True)
add_bone("Chest", (0.0, -0.14, 0.17), (0.0, -0.40, 0.20), "Spine", True)
add_bone("Neck", (0.0, -0.40, 0.20), (0.0, -0.62, 0.24), "Chest", True)
add_bone("Head", (0.0, -0.62, 0.24), (0.0, -0.94, 0.20), "Neck", True)

add_bone("Tail.01", (0.0, 0.57, 0.17), (0.0, 0.78, 0.12), "Pelvis")
add_bone("Tail.02", (0.0, 0.78, 0.12), (0.0, 0.83, -0.08), "Tail.01", True)
add_bone("Tail.03", (0.0, 0.83, -0.08), (0.0, 0.84, -0.40), "Tail.02", True)

for side, x in (("L", 0.16), ("R", -0.16)):
    add_bone(
        f"Foreleg.{side}.Upper",
        (x, -0.34, 0.08),
        (x, -0.36, -0.22),
        "Chest",
    )
    add_bone(
        f"Foreleg.{side}.Lower",
        (x, -0.36, -0.22),
        (x, -0.40, -0.52),
        f"Foreleg.{side}.Upper",
        True,
    )
    add_bone(
        f"Foreleg.{side}.Hoof",
        (x, -0.40, -0.52),
        (x, -0.48, -0.57),
        f"Foreleg.{side}.Lower",
        True,
    )
    add_bone(
        f"Hindleg.{side}.Upper",
        (x, 0.34, 0.08),
        (x, 0.50, -0.20),
        "Pelvis",
    )
    add_bone(
        f"Hindleg.{side}.Lower",
        (x, 0.50, -0.20),
        (x, 0.65, -0.51),
        f"Hindleg.{side}.Upper",
        True,
    )
    add_bone(
        f"Hindleg.{side}.Hoof",
        (x, 0.65, -0.51),
        (x, 0.74, -0.57),
        f"Hindleg.{side}.Lower",
        True,
    )

bpy.ops.object.mode_set(mode="OBJECT")

bone_radii = {
    "Pelvis": 0.42,
    "Spine": 0.42,
    "Chest": 0.42,
    "Neck": 0.30,
    "Head": 0.34,
    "Tail.01": 0.12,
    "Tail.02": 0.10,
    "Tail.03": 0.09,
}
for side in ("L", "R"):
    bone_radii.update(
        {
            f"Foreleg.{side}.Upper": 0.20,
            f"Foreleg.{side}.Lower": 0.16,
            f"Foreleg.{side}.Hoof": 0.13,
            f"Hindleg.{side}.Upper": 0.24,
            f"Hindleg.{side}.Lower": 0.21,
            f"Hindleg.{side}.Hoof": 0.17,
        }
    )


def distance_to_segment(point: Vector, start: Vector, end: Vector) -> float:
    segment = end - start
    denominator = segment.length_squared
    if denominator <= 1e-12:
        return (point - start).length
    factor = max(0.0, min(1.0, (point - start).dot(segment) / denominator))
    return (point - (start + segment * factor)).length


for group in list(cow.vertex_groups):
    cow.vertex_groups.remove(group)

deform_bones = [
    bone
    for bone in armature.data.bones
    if bone.use_deform and bone.name in bone_radii
]
vertex_groups = {
    bone.name: cow.vertex_groups.new(name=bone.name)
    for bone in deform_bones
}

for vertex in cow.data.vertices:
    scored_bones = []
    for bone in deform_bones:
        if bone.name.startswith("Tail.") and not (
            vertex.co.y > 0.56 and abs(vertex.co.x) < 0.105
        ):
            scored_bones.append((0.0, bone.name))
            continue
        distance = distance_to_segment(vertex.co, bone.head_local, bone.tail_local)
        radius = bone_radii[bone.name]
        score = math.exp(-2.0 * (distance / radius) ** 2)
        scored_bones.append((score, bone.name))
    strongest = sorted(scored_bones, reverse=True)[:4]
    total = sum(score for score, _ in strongest)
    if total <= 1e-12:
        strongest = [(1.0, "Spine")]
        total = 1.0
    for score, bone_name in strongest:
        vertex_groups[bone_name].add([vertex.index], score / total, "REPLACE")

armature_modifier = cow.modifiers.new(name="Genlix_Cow_Rig", type="ARMATURE")
armature_modifier.object = armature
cow.parent = armature

EYE_Y = -0.722
EYE_Z = 0.420


def make_blink_shape_key() -> None:
    if cow.data.shape_keys:
        basis = cow.data.shape_keys.key_blocks.get("Basis")
    else:
        basis = cow.shape_key_add(name="Basis", from_mix=False)
    if basis is None:
        raise RuntimeError("Unable to create the Basis shape key")

    blink = cow.shape_key_add(name="Blink", from_mix=False)
    changed = 0

    for vertex in cow.data.vertices:
        x, y, z = vertex.co
        side_distance = abs(abs(x) - 0.175) / 0.080
        length_distance = abs(y - EYE_Y) / 0.095
        vertical_distance = abs(z - EYE_Z) / 0.075
        distance = (
            side_distance * side_distance
            + vertical_distance * vertical_distance
            + length_distance * length_distance
        )
        if distance >= 1.0:
            continue
        falloff = (1.0 - distance) ** 2
        target_z = EYE_Z + (z - EYE_Z) * 0.08
        blink.data[vertex.index].co.z += (target_z - z) * falloff
        blink.data[vertex.index].co.x += math.copysign(0.0025 * falloff, x)
        changed += 1

    if changed < 20:
        raise RuntimeError(f"Blink region selected too few vertices: {changed}")
    print(f"Blink shape key vertices: {changed}")


make_blink_shape_key()

eyelid_material = bpy.data.materials.new("Genlix_Eyelid_Material")
eyelid_material.diffuse_color = (0.55, 0.52, 0.48, 1.0)
eyelid_material.use_nodes = True
eyelid_principled = eyelid_material.node_tree.nodes.get("Principled BSDF")
eyelid_principled.inputs["Base Color"].default_value = (0.55, 0.52, 0.48, 1.0)
eyelid_principled.inputs["Roughness"].default_value = 0.62

eyelids = []
for side_name, sign in (("L", 1.0), ("R", -1.0)):
    eye_zone = [
        vertex.co
        for vertex in cow.data.vertices
        if abs(vertex.co.y - EYE_Y) < 0.055
        and abs(vertex.co.z - EYE_Z) < 0.050
        and vertex.co.x * sign > 0
    ]
    if len(eye_zone) < 10:
        raise RuntimeError(f"Unable to resolve the {side_name} eye surface")
    surface_x = (
        max(point.x for point in eye_zone)
        if sign > 0
        else min(point.x for point in eye_zone)
    )
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=24,
        ring_count=12,
        location=(surface_x + sign * 0.0035, EYE_Y, EYE_Z),
        scale=(0.0040, 0.025, 0.0085),
    )
    eyelid = bpy.context.object
    eyelid.name = f"Genlix_Eyelid.{side_name}"
    eyelid.data.materials.append(eyelid_material)
    bpy.context.view_layer.objects.active = eyelid
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    world_matrix = eyelid.matrix_world.copy()
    eyelid.parent = armature
    eyelid.parent_type = "BONE"
    eyelid.parent_bone = "Head"
    eyelid.matrix_world = world_matrix
    eyelids.append(eyelid)
    print(f"{eyelid.name} surface X: {surface_x:.4f}")

scene = bpy.context.scene
scene.render.fps = 30
scene.frame_start = 1
scene.frame_end = 120

armature.animation_data_create()
idle_action = bpy.data.actions.new("Genlix_Idle")
armature.animation_data.action = idle_action


def key_rotation(
    bone_name: str,
    frame_values: list[tuple[int, tuple[float, float, float]]],
) -> None:
    pose_bone = armature.pose.bones[bone_name]
    pose_bone.rotation_mode = "XYZ"
    for frame, degrees in frame_values:
        pose_bone.rotation_euler = tuple(math.radians(value) for value in degrees)
        pose_bone.keyframe_insert(data_path="rotation_euler", frame=frame, group=bone_name)


key_rotation(
    "Head",
    [
        (1, (0.0, 0.0, 0.0)),
        (25, (0.0, 0.0, 9.0)),
        (55, (0.0, 0.0, -7.0)),
        (85, (0.0, 0.0, 6.0)),
        (120, (0.0, 0.0, 0.0)),
    ],
)
key_rotation(
    "Neck",
    [
        (1, (0.0, 0.0, 0.0)),
        (25, (0.0, 0.0, 3.0)),
        (55, (0.0, 0.0, -2.0)),
        (85, (0.0, 0.0, 2.0)),
        (120, (0.0, 0.0, 0.0)),
    ],
)
key_rotation(
    "Tail.01",
    [
        (1, (0.0, 0.0, -7.0)),
        (16, (0.0, 0.0, 12.0)),
        (32, (0.0, 0.0, -12.0)),
        (48, (0.0, 0.0, 10.0)),
        (64, (0.0, 0.0, -10.0)),
        (80, (0.0, 0.0, 12.0)),
        (96, (0.0, 0.0, -12.0)),
        (120, (0.0, 0.0, -7.0)),
    ],
)
key_rotation(
    "Tail.02",
    [
        (1, (0.0, 0.0, 5.0)),
        (16, (0.0, 0.0, -16.0)),
        (32, (0.0, 0.0, 16.0)),
        (48, (0.0, 0.0, -14.0)),
        (64, (0.0, 0.0, 14.0)),
        (80, (0.0, 0.0, -16.0)),
        (96, (0.0, 0.0, 16.0)),
        (120, (0.0, 0.0, 5.0)),
    ],
)
key_rotation(
    "Tail.03",
    [
        (1, (0.0, 0.0, 4.0)),
        (16, (0.0, 0.0, -20.0)),
        (32, (0.0, 0.0, 20.0)),
        (48, (0.0, 0.0, -18.0)),
        (64, (0.0, 0.0, 18.0)),
        (80, (0.0, 0.0, -20.0)),
        (96, (0.0, 0.0, 20.0)),
        (120, (0.0, 0.0, 4.0)),
    ],
)

shape_keys = cow.data.shape_keys
shape_keys.animation_data_create()
blink_action = bpy.data.actions.new("Genlix_Blink")
shape_keys.animation_data.action = blink_action
blink = shape_keys.key_blocks["Blink"]
blink.value = 0.0
blink.keyframe_insert(data_path="value", frame=1)
for blink_start in (38, 83):
    blink.value = 0.0
    blink.keyframe_insert(data_path="value", frame=blink_start)
    blink.value = 1.0
    blink.keyframe_insert(data_path="value", frame=blink_start + 2)
    blink.value = 0.0
    blink.keyframe_insert(data_path="value", frame=blink_start + 5)
blink.value = 0.0
blink.keyframe_insert(data_path="value", frame=120)

for eyelid in eyelids:
    eyelid.animation_data_create()
    eyelid_action = bpy.data.actions.new(f"Genlix_Blink_{eyelid.name.rsplit('.', 1)[-1]}")
    eyelid.animation_data.action = eyelid_action
    eyelid.scale = (1.0, 1.0, 0.02)
    eyelid.keyframe_insert(data_path="scale", frame=1)
    for blink_start in (38, 83):
        eyelid.scale = (1.0, 1.0, 0.02)
        eyelid.keyframe_insert(data_path="scale", frame=blink_start)
        eyelid.scale = (1.0, 1.0, 1.0)
        eyelid.keyframe_insert(data_path="scale", frame=blink_start + 2)
        eyelid.scale = (1.0, 1.0, 0.02)
        eyelid.keyframe_insert(data_path="scale", frame=blink_start + 5)
    eyelid.scale = (1.0, 1.0, 0.02)
    eyelid.keyframe_insert(data_path="scale", frame=120)

# Keep the actions active on their owners. Blender evaluates them for previews,
# and the glTF exporter emits the armature and morph-target animation tracks.
armature.animation_data.action = idle_action
shape_keys.animation_data.action = blink_action


def setup_preview() -> None:
    world = bpy.data.worlds.new("Preview World")
    scene.world = world
    world.use_nodes = True
    background = world.node_tree.nodes.get("Background")
    background.inputs["Color"].default_value = (0.025, 0.032, 0.04, 1.0)
    background.inputs["Strength"].default_value = 0.45

    bpy.ops.mesh.primitive_plane_add(size=8.0, location=(0.0, 0.0, -0.628))
    floor = bpy.context.object
    floor.name = "Preview_Floor"
    floor_material = bpy.data.materials.new("Preview_Floor_Material")
    floor_material.diffuse_color = (0.07, 0.08, 0.09, 1.0)
    floor.data.materials.append(floor_material)

    key_data = bpy.data.lights.new("Preview_Key", type="AREA")
    key_data.energy = 850
    key_data.shape = "DISK"
    key_data.size = 3.0
    key = bpy.data.objects.new("Preview_Key", key_data)
    bpy.context.collection.objects.link(key)
    key.location = (3.2, -2.5, 3.0)
    key.rotation_euler = (math.radians(28), 0, math.radians(145))

    fill_data = bpy.data.lights.new("Preview_Fill", type="AREA")
    fill_data.energy = 450
    fill_data.size = 2.5
    fill = bpy.data.objects.new("Preview_Fill", fill_data)
    bpy.context.collection.objects.link(fill)
    fill.location = (-3.0, 2.0, 1.5)
    fill.rotation_euler = (math.radians(68), 0, math.radians(-35))

    camera_data = bpy.data.cameras.new("Preview_Camera")
    camera_data.type = "ORTHO"
    camera_data.ortho_scale = 2.55
    camera = bpy.data.objects.new("Preview_Camera", camera_data)
    bpy.context.collection.objects.link(camera)
    camera.location = (3.5, 0.0, 0.12)
    camera.rotation_euler = (
        Vector((0.0, 0.0, 0.02)) - camera.location
    ).to_track_quat("-Z", "Y").to_euler()
    scene.camera = camera

    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 960
    scene.render.resolution_y = 720
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.view_settings.look = "AgX - Medium High Contrast"


setup_preview()

for frame in (1, 25, 40, 55, 85):
    scene.frame_set(frame)
    scene.render.filepath = str(preview_dir / f"frame-{frame:03d}.png")
    bpy.ops.render.render(write_still=True)

preview_camera = scene.camera
preview_camera.location = (3.0, 2.8, 0.85)
preview_camera.rotation_euler = (
    Vector((0.0, 0.0, 0.02)) - preview_camera.location
).to_track_quat("-Z", "Y").to_euler()
preview_camera.data.ortho_scale = 2.60
for frame in (1, 16, 32):
    scene.frame_set(frame)
    scene.render.filepath = str(preview_dir / f"three-quarter-{frame:03d}.png")
    bpy.ops.render.render(write_still=True)

scene.frame_set(1)
blend_path = editable_dir / "genlix-cow-rigged.blend"
bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))

# Export only the model and rig; preview lights, camera and floor remain in the
# editable .blend file but are intentionally omitted from the web asset.
bpy.ops.object.select_all(action="DESELECT")
cow.select_set(True)
armature.select_set(True)
for eyelid in eyelids:
    eyelid.select_set(True)
bpy.context.view_layer.objects.active = armature
glb_path = output_dir / "genlix-cow-rigged.glb"
bpy.ops.export_scene.gltf(
    filepath=str(glb_path),
    export_format="GLB",
    use_selection=True,
    export_skins=True,
    export_animations=True,
)

print(f"Saved editable rig: {blend_path}")
print(f"Saved animated web model: {glb_path}")
print(f"Rendered previews: {preview_dir}")
