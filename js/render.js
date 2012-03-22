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

/** Mesh files **/
var polyhedron 	= "data/cube.bv";
var default_mesh = polyhedron;
var bicubic 	= "data/tp3x3.bv";
var rational 	= "data/dtorus.bv";
var triangular 	= "data/tri1.bv";

/** render mode **/
var render_mode = bvPatch.normal;


/** The initialization function **/
function init(default_mesh) {

	scene = new THREE.Scene();

	// initialize curvature
	init_crv();

	// Camera
	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.01, 10000 );
	camera.position.z = 6;
	scene.add( camera );

	// Lights
	pointLight1 = new THREE.PointLight( 0xffffff );
	pointLight1.position.x = 360;
	pointLight1.position.z = 360;

	scene.add( pointLight1 );

	pointLight2 = new THREE.PointLight( 0xffffff );
	pointLight2.position.x = -360;
	pointLight2.position.z = 0;

	scene.add( pointLight2 );

	// Renderer
	renderer = new THREE.WebGLRenderer();
	renderer.sortObjects = false;
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setFaceCulling(false) ;

	// Controls
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

	// load the mesh
	loadMeshFromFile(default_mesh);
	
	return renderer.domElement;

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

/** Changes mesh **/
function setMesh(file) {
	// first remove all the current ones
	removeAllMeshes();
	
	// load new one
	loadMeshFromFile(file);
}

/** Removes all the meshes from the scene **/
function removeAllMeshes() {
	for (var i = 0; i < patch_meshes.length; i++) {
		scene.remove(patch_meshes[i]);
		scene.remove(control_meshes[i]);
	}
}

/** Load Mesh from string data **/
function loadMesh(data) {
	var patches = read_patches_from_string(data);
	// all the meshes
	patch_meshes = [];
	control_meshes = [];

	for(var i = 0; i < patches.length; i++){

		// the meshes
		var patch_mesh = new bvPatch(patches[i], {subdivisionLevel: subdivision_level});

		patch_mesh.scale.set(0.5,0.5,0.5);	
		scene.add( patch_mesh );
		patch_meshes.push(patch_mesh); // add to the list

		// control mesh
		var control_geometry;
		if (patches[i].type == 1) // polyhedron
			control_geometry = patches[i].geometry;
		else
			control_geometry = eval_control_mesh(patches[i].type, [patches[i].degu,patches[i].degv], patches[i].pts);
		control_mesh = new THREE.Mesh( control_geometry,  new THREE.MeshBasicMaterial( { color: 0x000000, wireframe: true } ));
		control_mesh.doubleSided = true;
		control_mesh.scale.set(0.5,0.5,0.5);
		scene.add(control_mesh);
		control_meshes.push(control_mesh);	
			
		// Set's the curvature's range after generating all the patches [min and max]
		// TODO: Set range by slider interface
		setPatchCurvatureRange([min_crv.x,min_crv.y,min_crv.z,min_crv.w],[max_crv.x,max_crv.y,max_crv.z,max_crv.w]);
			
		// proper viewing of patches and control mesh
		toggle_patches();
		toggle_controlMeshes();
			
		// render mode
		setRenderMode(render_mode);
	}
}

/** Loads the patches from a file **/
function loadMeshFromFile(file) {
	$.get(file, function(data) {
		loadMesh(data);	
	})
	.error(function() {
		alert('Error reading ' + file);
	});
}

// Sets the render mode of the patches
function setRenderMode(mode) {
	// update for each mesh
	render_mode = mode;
	for (var i = 0; i < patch_meshes.length; i++)
		patch_meshes[i].setRenderMode(mode);
}

// toggle viewing control meshes
function toggle_controlMeshes(toggle) {
	toggle !== 'undefined' ? toggle : false;
	if (toggle)
		show_controlMesh = !show_controlMesh;
	for (var i = 0; i < control_meshes.length; i++) 
		if (show_controlMesh)
			control_meshes[i].visible = true;
		else
			control_meshes[i].visible = false;
}

// toggle viewing patches
function toggle_patches(toggle) {
	toggle !== 'undefined' ? toggle : false;
	if (toggle)
		show_patch = !show_patch;
	for (var i = 0; i < patch_meshes.length; i++) 
		if (show_patch)
			patch_meshes[i].visible = true;
		else
			patch_meshes[i].visible = false;
}

// set the curvature scale range
function setPatchCurvatureRange(minc,maxc){
	for(var i = 0; i < patch_meshes.length; i++){
		patch_meshes[i].setCurvatureRange(minc,maxc);
	}    
}
