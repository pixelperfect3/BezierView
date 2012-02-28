/* Variables for the scene */
var camera, scene, renderer,
    geometry, material, regular_material, curvature_material, controls, pointLight;

// the meshes
var patch_mesh, curvature_mesh, current_mesh;

/* User-dependent variables */
var show_curvature, show_controlMesh, show_patch;
show_controlMesh = true;
show_patch = true;
show_curvature = false;

var subdivision_level = 5;

bvstr = "";

var test_url = "data/cube.bv";//teapot.bv";//tp3x3.bv";

/* get the data */
$.get(test_url, function(data) {
		bvstr = data;
		init();
		animate();
		})
.error(function() {
		alert('Error reading ' + test_url);
		});


/** The initialization function **/
function init() {

	// console.log(bvstr);
	// geo.computeBoundingSphere();

	scene = new THREE.Scene();

	// Get all the patch info (type, degree, control points, etc.)
	var patches = read_patches_from_string(bvstr);

	// initialize curvature
	init_crv();

	// all the meshes
	patch_meshes = [];
	control_meshes = [];

	for(var i = 0; i < patches.length; i++){

		// the meshes
		var patch_mesh = new bvPatch(patches[i].type, patches[i].degs, patches[i].pts, {subdivisionLevel: subdivision_level});
		/*switch(patches[i].type) {
		  case 4:
		  patch_mesh = new bvPatch(patches[i].pts, {subdivisionLevel: subdivision_level});
		  }*/

		patch_mesh.scale.set(0.5,0.5,0.5);	
		scene.add( patch_mesh );
		patch_meshes.push(patch_mesh); // add to the list

		// Which mesh are we currently looking at? TODO: Need to handle multiple patches
		current_mesh = patch_mesh;

		// TODO: For multiple patches
		/*patches.push(new THREE.Mesh(geo, patch_material));
		  alert("Patch: " + patches[i]);
		  patches[i].doubleSided = true;
		  patches[i].scale.set(0.5,0.5,0.5);*/
		//patches_mesh.push(patch_mesh);
		//alert(patches);

		// control mesh
		var control_geometry;
		if (patches[i].type == 1) // polyhedron
			control_geometry = patches[i].pts;
		else
			control_geometry = eval_control_mesh(patches[i].type, patches[i].degs, patches[i].pts);
		control_mesh = new THREE.Mesh( control_geometry,  new THREE.MeshBasicMaterial( { color: 0x000000, wireframe: true } ));
		control_mesh.doubleSided = true;
		control_mesh.scale.set(0.5,0.5,0.5);
		scene.add(control_mesh);
		control_meshes.push(control_mesh);
	}


	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.01, 10000 );
	camera.position.z = 6;
	scene.add( camera );

	// control_geometry = eval_control_mesh([vecs[0],vecs[0]],vecs[1]);
	// control_geometry.dynamic = true;
	// control_mesh = new THREE.Mesh( control_geometry,  new THREE.MeshBasicMaterial( { color: 0x000000, wireframe: true } ));
	// control_mesh.doubleSided = true;
	// scene.add(control_mesh);

	// Light

	pointLight1 = new THREE.PointLight( 0xffffff );
	pointLight1.position.x = 360;
	pointLight1.position.z = 360;

	scene.add( pointLight1 );

	pointLight2 = new THREE.PointLight( 0xffffff );
	pointLight2.position.x = -360;
	pointLight2.position.z = 0;

	scene.add( pointLight2 );

	renderer = new THREE.WebGLRenderer();
	renderer.sortObjects = false;
	//renderer = new THREE.CanvasRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setFaceCulling(false) ;

	controls = new THREE.TrackballControls( camera, renderer.domElement );
	controls.rotateSpeed = 1.0;
	controls.zoomSpeed = 1.2;
	controls.panSpeed = 0.2;

	controls.noZoom = false;
	controls.noPan = false;

	controls.staticMoving = false;
	controls.dynamicDampingFactor = 0.3;

	var radius = 2;
	controls.minDistance = radius * 1.1;
	controls.maxDistance = radius * 100;

	document.body.appendChild( renderer.domElement );


}

/** the loop function **/
function animate() {

	// note: three.js includes requestAnimationFrame shim
	controls.update();
	requestAnimationFrame( animate );
	render();

}

/** the main render function **/
function render() {
	renderer.render( scene, camera );

}

// Sets the render mode of the patches
function setRenderMode(mode) {
	// update for each mesh
	for (var i = 0; i < patch_meshes.length; i++)
		patch_meshes[i].setRenderMode(mode);
}

// toggle viewing control meshes
function toggle_controlMesh() {
	show_controlMesh = !show_controlMesh;
	for (var i = 0; i < control_meshes.length; i++) 
		if (show_controlMesh)
			control_meshes[i].visible = true;
		else
			control_meshes[i].visible = false;
}

// toggle viewing patches
function toggle_patches() {
	show_patch = !show_patch;
	for (var i = 0; i < patch_meshes.length; i++) 
		if (show_patch)
			patch_meshes[i].visible = true;
		else
			patch_meshes[i].visible = false;
}


// OLD CODE:
/** keypresses **/
/*$(document).keypress(function(evt) {
// get the character
var ch = String.fromCharCode(evt.keyCode);
switch(ch) {
case 'm': // control mesh
toggle_controlMesh();
break;
case 'p': // patches
toggle_patches();
break;
case 'c': // curvature
change_color();//toggle_curvature();
//toggle_patches();
break;
default:
break;
// TODO: Add for curvature, patches, etc.
}
}
);

function toggle_curvature() {
show_curvature = !show_curvature;
//patch_mesh.visible = false;
//curvature_mesh.visible = true;
current_mesh.visible = false;
if (show_curvature) {
current_mesh = curvature_mesh;
}
else
current_mesh = patch_mesh;

// is it visible?
if (show_patch)
current_mesh.visible = true;//scene.add(patch_mesh);	
}

function toggle_highlight() {
if(current_mesh.getRenderMode() == bvQuadPatch.HighlightLine){
current_mesh.setRenderMode(bvQuadPatch.ReflectionLine);
}
else
current_mesh.setRenderMode(bvQuadPatch.HighlightLine);
}*/


