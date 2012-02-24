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

bvstr = "";

var test_url = "data/tp3x3.bv";

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
  
  var patches = read_quad_bezier_from_string(bvstr);
  
  init_crv();
 
  for(var i = 0; i < patches.length; i++){
    var patch = patches[i];
    // console.log(patch);
    geometry = eval_patch([patch[0],patch[0]],patch[1],5);
	//geometry.dynamic = true;
	
	// material
    curvature_material = new THREE.MeshBasicMaterial( {  shading: THREE.SmoothShading, vertexColors: THREE.VertexColors, wireframe: false} );
	regular_material = new THREE.MeshPhongMaterial( { color: 0xff0000, specular:0xffffff, shininess:50, wireframe: false} );
	
	// the meshes
    patch_mesh = new THREE.Mesh( geometry, regular_material);
	patch_mesh.doubleSided = true;
    patch_mesh.scale.set(0.5,0.5,0.5);
	scene.addObject( patch_mesh );
	
	/** CURVATURE Hack - have to recreate geometry and use a different mesh. Probably not the most efficient way **/
	var geometry_curvature = eval_patch([patch[0],patch[0]],patch[1],5);
	curvature_mesh = new THREE.Mesh( geometry_curvature, curvature_material);
	curvature_mesh.doubleSided = true;
    curvature_mesh.scale.set(0.5,0.5,0.5);
	scene.addObject( curvature_mesh );
	curvature_mesh.visible = false; // initially invisible
   	
	// Which mesh are we currently looking at?
	current_mesh = patch_mesh;
	
	// TODO: For multiple patches
	/*patches.push(new THREE.Mesh(geo, patch_material));
	alert("Patch: " + patches[i]);
	patches[i].doubleSided = true;
	patches[i].scale.set(0.5,0.5,0.5);*/
	//patches_mesh.push(patch_mesh);
	//alert(patches);
	
	// control mesh
	var control_geometry = eval_control_mesh([patch[0],patch[0]],patch[1]);
	control_mesh = new THREE.Mesh( control_geometry,  new THREE.MeshBasicMaterial( { color: 0x000000, wireframe: true } ));
	control_mesh.doubleSided = true;
	control_mesh.scale.set(0.5,0.5,0.5);
	//scene.add(control_mesh);
	if (show_controlMesh)
		scene.add(control_mesh);	
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

/** keypresses **/
$(document).keypress(function(evt) {
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
			toggle_curvature();
			//toggle_patches();
			break;
		default:
			break;
		// TODO: Add for curvature, patches, etc.
	}
}
);

// toggle variables - callbacks for keypresses and checkboxes
function toggle_controlMesh() {
	show_controlMesh = !show_controlMesh;
	if (show_controlMesh)
		control_mesh.visible = true;//scene.add(control_mesh);	
  	else
  		control_mesh.visible = false;//scene.remove(control_mesh);
}

function toggle_patches() {
	show_patch = !show_patch;
	// show patches?
  	if (show_patch)
		current_mesh.visible = true;//scene.add(patch_mesh);	
  	else
  		current_mesh.visible = false;//scene.remove(patch_mesh);	
}

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
		current_mesh.visible = true;//scene.add(patch_mesh);	*/
}

