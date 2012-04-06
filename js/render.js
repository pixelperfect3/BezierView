/* Variables for the scene */
var camera, scene, renderer,
    geometry, material, regular_material, curvature_material, controls, pointLight;

// the meshes
patch_meshes = [];
control_meshes = [];
var patch_mesh, curvature_mesh, current_mesh;

var patch_object, control_object;
var root_object; // TODO: Should have a better name?

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

	// load the mesh
	//loadMeshFromFile(default_mesh);
	
	return renderer.domElement;

}

/** the loop function **/
function animate() {

	// note: three.js includes requestAnimationFrame shim
	if(controls !== undefined)
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
	scene.remove(root_object);
}

/** Load Mesh from string data **/
function loadMesh(data) {
	var patches = read_patches_from_string(data);
	// all the meshes
	patch_meshes = [];
	control_meshes = [];
	patch_object = new THREE.Object3D();
	control_object = new THREE.Object3D();

	// initialize curvature
	init_crv();

	for(var i = 0; i < patches.length; i++){

		// the meshes
		var patch_mesh = new bvPatch(patches[i], {subdivisionLevel: subdivision_level});

		patch_meshes.push(patch_mesh); // add to the list
		patch_object.add(patch_mesh);

		// control mesh
		var control_geometry;
		if (patches[i].type == 1) 		// polyhedron
			control_geometry = patches[i].geometry;
		else if (patches[i].type == 3) 	// triangular bezier
			control_geometry = eval_control_mesh(patches[i].type, patches[i].deg, patches[i].pts);
		else
			control_geometry = eval_control_mesh(patches[i].type, [patches[i].degu,patches[i].degv], patches[i].pts);
		control_mesh = new THREE.Mesh( control_geometry,  new THREE.MeshBasicMaterial( { color: 0x000000, wireframe: true } ));
		control_mesh.doubleSided = true;
		control_meshes.push(control_mesh);				
		control_object.add(control_mesh);
			
		// proper viewing of patches and control mesh
		toggle_patches();
		toggle_controlMeshes();
			
		// render mode
		setRenderMode(render_mode);
	}

	// add root object for easier scale and moving
	root_object = new THREE.Object3D();
	root_object.add(patch_object);
	root_object.add(control_object);
	scene.add(root_object);

	// Controller for moveing the object
	controls = new THREE.ObjectControls( root_object, camera, renderer.domElement );
	controls.rotateSpeed = 0.2;
	controls.zoomSpeed = 1.2;
	controls.panSpeed = 1.0;

	controls.staticMoving = false;
	controls.dynamicDampingFactor = 0.8;

	var radius = 2;
	controls.minDistance = radius * 1.1;
	controls.maxDistance = radius * 100;


	// Set's the curvature's range after generating all the patches [min and max]
	// TODO: Set range by slider interface
	setPatchCurvatureRange([min_crv.x,min_crv.y,min_crv.z,min_crv.w],[max_crv.x,max_crv.y,max_crv.z,max_crv.w]);


	// compute the bounding box for the whole patch
	var min = new THREE.Vector3();
	var max = new THREE.Vector3();

	if(patch_meshes.length >= 1){
		min.copy(patch_meshes[0].geometry.boundingBox.min);
		max.copy(patch_meshes[0].geometry.boundingBox.max);

		for(var i = 1; i < patch_meshes.length; i++){
			var box = patch_meshes[i].geometry.boundingBox;

			if(box.min.x < min.x)
				min.x = box.min.x

			if(box.min.y < min.y)
				min.y = box.min.y

			if(box.min.z < min.z)
				min.z = box.min.z

			if(box.max.x > max.x)
				max.x = box.max.x

			if(box.max.y > max.y)
				max.y = box.max.y

			if(box.max.z > max.z)
				max.z = box.max.z
		}
	}

	// calculate the scale ratio from the bounding box
	var boxsize = max.subSelf(min);
	var diameter = Math.max(boxsize.x,boxsize.y,boxsize.z);

	// TODO: hardcode here, should scale accroding to the camera
	var scale_ratio = 4.0/diameter;

	// scale both the patch and control mesh

	root_object.scale.set(scale_ratio,scale_ratio,scale_ratio);
	
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
	
	// set visible for parent object will not affect children
	// so use showHierarchy
	THREE.SceneUtils.showHierarchy(control_object,show_controlMesh);
}

// toggle viewing patches
function toggle_patches(toggle) {
	toggle !== 'undefined' ? toggle : false;
	if (toggle)
		show_patch = !show_patch;

	// set visible for parent object will not affect children
	// so use showHierarchy
	THREE.SceneUtils.showHierarchy(patch_object,show_patch);
}

// set the curvature scale range
function setPatchCurvatureRange(minc,maxc){
	for(var i = 0; i < patch_meshes.length; i++){
		patch_meshes[i].setCurvatureRange(minc,maxc);
	}    
}

// Sets the size of the renderer 
function setRendererSize() {
	if (renderer) {
		renderer.setSize( window.innerWidth, window.innerHeight );
		
		// update the projection matrix of the camera too
		camera.aspect = window.innerWidth/window.innerHeight;
		camera.updateProjectionMatrix();
	}
}
