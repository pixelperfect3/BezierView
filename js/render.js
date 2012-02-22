/* Variables for the scene */
var camera, scene, renderer,
 geometry, material,  mesh, controls, pointLight;

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




function BBcopy4( buf, degu, degv, st, bb)
{
  var i,j;
  var C;

  // buf is arranged by
  //  columns -- v, rows -- u
  //    p11       p12    .... p1(degv+1)
  //    p21       p22    .... p2(degv+1)
  //     ..       ..     ....    ..
  // p(degu+1)1 p(degu+1)1 .. p(degu+1)(degv+1)

  C = st*degu +1;
  for (i=0; i<=degu; i++) {
    for (j=0; j<=degv; j++) {
      //double *v;
      //v = buf + (i*(degv+1) + j) * DIM;
      //Vcopy(v, bb[(j* st)* C + i*st]);

      bb[(j* st)* C + i*st].copy(buf[i*(degv+1) + j]);

    }
  }
}

function RSubDiv(bb, step, degu, degv, sizeu, sizev)
{
  var 	m,k,l;
  var 	row,col,
  C;
  var 	h,h1,h2,st2,bigstepu, bigstepv,
  i1,i2,i3;

  st2 = step/2;
  bigstepu = step*degu;
  bigstepv = step*degv;
  C = sizeu+1;

  for (row=0; row<sizev; row += bigstepv)   /* patch-level */
    for (col=0; col<=sizeu; col += step)  {
      /* subdivide a curve-column of degree degv */
      for (l=0; l<degv; l++)  {	/*levels of subdiv. triangle */
	h = row + l*st2;
	for (k=0; k<(degv-l); k++)  {
	  h1= h + step;
	  h2= h + st2;
	  i1 = h2*C+col;
	  i2 = h*C+col;
	  i3 = h1*C+col;
	  // bb[i1] = (bb[i2] + bb[i3])/2;
	  bb[i1].add(bb[i2],bb[i3]);
	  bb[i1].divideScalar(2.0);
	  // for (m=0; m<DIM; m++)
	  // bb[i1][m] = (bb[i2][m] + bb[i3][m])/2;
	  h = h1;
	}
      }
    }
  for (col=0; col<sizeu; col += bigstepu)   /* 2 x patch-level */
    for (row=0; row<=sizev; row += st2)  {
      /* subdivide a curve-row of degree deg */
      for (l=0; l<degu; l++)  {	/*levels of subdiv. triangle */
	h = col + l*st2;
	for (k=0; k<(degu-l); k++)  {
	  h1= h + step;
	  h2= h + st2;
	  i1 = row*C+h2;
	  i2 = row*C+h;
	  i3 = row*C+h1;

	  // bb[i1] = (bb[i2] + bb[i3])/2;
	  bb[i1].add(bb[i2],bb[i3]);
	  bb[i1].divideScalar(2.0);

	  //for (m=0; m<DIM; m++)
	  //bb[i1][m] = (bb[i2][m] + bb[i3][m])/2;
	  h = h1;
	}
      }
    }
}



function VVcross(v1, v2)
{
  var v3 = new THREE.Vector4();

  v3.x = (v1.y)*(v2.z) - (v1.z)*(v2.y);
  v3.y = (v1.z)*(v2.x) - (v1.x)*(v2.z);
  v3.z = (v1.x)*(v2.y) - (v1.y)*(v2.x);
  v3.w = 0.0;

  return v3;
}/*VVcross*/


function evalPN(v00, v01, v10, P, N)
{
  var hv1 = v10.clone().subSelf(v00);
  var hv2 = v01.clone().subSelf(v00);
  var Normal = VVcross(hv1,hv2);
  Normal.normalize();
  N.set(Normal.x,Normal.y,Normal.z);
  P.copy(v00);
  P.divideScalar(P.w);
}




function eval_patch(degs,vecs,subDepth){
  var     size;
  var     Cu, Cv, st, C;
  var     sizeu, sizev, bigstepu, bigstepv, degu, degv;
  var     r, rs, r1, r2, c, loc;
  var  h;
  var    bb;

  degu = degs[0];
  degv = degs[1];

  var pts  = 1 << subDepth;
  
  // allocate the memory for the result of evaluation
  C    = pts+1;
  size = C*C;            // how big should the array be
  var eval_P = new Array(size);
  var eval_N = new Array(size);
  var crv_array = new Array(size);  // 4 types of curvatures

  for(var i = 0; i < size; i++){
    eval_P[i] = new THREE.Vector4();
    eval_N[i] = new THREE.Vector3();
    crv_array[i] = new THREE.Vector4();
  }
 
   /*
    use for crv needle, leave for future
 
   //Jianwei
   crv_filter = new Array(size);
   for (var i=0; i<size; i++){
   crv_filter[i] = false;
   }
   */

  // allocate a temporary memory to perform subdivision
  //    subdivision VS de Casteljau ??
  //
  //    now subdivision because the code already exists,
  //
  //    De Casteljau clearly do not need this temporary memory,
  //    but maybe slower compare to this code.
  //
  st = pts;         // original space between two coefficients

  // it is set to 'pts' so that after subdivision
  // the memory becomes tight

  sizeu = st*degu;  // size for both directions
  sizev = st*degv;
  Cu = sizeu+1;       // 0,0     ..  0,sizeu
  Cv = sizev+1;       // sizev,0 .. sizev, sizev

  bb = new Array( Cu * Cv );
  for(var i=0; i < bb.length; i++)
    bb[i] = new THREE.Vector4();

  // BBcopy4(PAcopy4) -- copy the original data into the sparse array
  BBcopy4( vecs, degu, degv, pts, bb);

  // subdivision
  for (var i=0; i <subDepth; i++)
  {
    RSubDiv(bb, st, degu, degv, sizeu,sizev);
    st = st/2;  // distance halves after each subdivision
  }

  //    bigstepu = st*degu;	/* distance between patches -> column direction */
  //    bigstepv = st*degv;	/* distance between patches -> row direction */

  bigstepu = degu;	/* distance between patches -> column direction */
  bigstepv = degv;	/* distance between patches -> row direction */

  // st==1
  for (var r=0; r<sizev; r += bigstepv)  // row
  {
    rs = r*Cu;
    r1 = (r+st)*Cu;
    r2 = (r+2*st)*Cu;
    for (var c = 0; c<sizeu; c += bigstepu) {   // column
      loc = (c/bigstepu*C + r/bigstepv) ;
      
       // curvature
       h = crv4(bb[rs+c],bb[rs+c+st],bb[rs+c+2*st], // curvature
       bb[r1+c],bb[r2+c],bb[r1+c+st],degu, degv, crv_array[loc]);
       
      evalPN(bb[rs+c], bb[r1+c], bb[rs+c+st], eval_P[loc],
	     eval_N[loc]);
      //printf (" %d %d %d %d %d %d \n", rs+c, rs+c+st, rs+c+2*st,
      //      r1+c, r2+c, r1+c+st);
    }

    // last col _| note: stencil is rotated by 90 degrees c = sizeu;
    loc = (c/bigstepu*C + r/bigstepv) ;
    
     h =crv4(bb[rs+c],bb[r1+c],bb[r2+c], bb[rs+c-st],
     bb[rs+c-2*st],bb[r1+c-st],degv, degu, crv_array[loc]);
     
    evalPN(bb[rs+c], bb[rs+c-st], bb[r1+c], eval_P[loc],
	   eval_N[loc]);

  }
  // top row |-
  r = sizev;
  rs = r*Cu;
  r1 = (r-st)*Cu;
  r2 = (r-2*st)*Cu;
  for (var c = 0; c<sizeu; c += bigstepu) {
    loc = (c/bigstepu*C + r/bigstepv) ;
    
     h =crv4(bb[rs+c],bb[r1+c],bb[r2+c], bb[rs+c+st],  	// curvature
     bb[rs+c+2*st],bb[r1+c+st],degv, degu, crv_array[loc]);
     
    evalPN(bb[rs+c], bb[rs+c+st], bb[r1+c], eval_P[loc],
	   eval_N[loc]);

  }

  // top right -|
  c = sizeu;
  loc = (c/bigstepu*C + r/bigstepv) ;
  
   h = crv4(bb[rs+c],bb[rs+c-st],bb[rs+c-2*st], bb[r1+c],  // curvature
   bb[r2+c], bb[r1+c-st],degu, degv, crv_array[loc]);
   
  evalPN(bb[rs+c], bb[r1+c], bb[rs+c-st],  eval_P[loc],
	 eval_N[loc]);
  /*
   // evaluate the artificial normals if necessary
   if(art_normal && use_art_normal) {
   printf("using artificial normals\n");
   for(r=0;r<=pts;r++) {
   double u = 1-(double)r/pts;
   for(c=0;c<=pts;c++) {
   double v = 1-(double)c/pts;
   loc = r*C+c;
   //printf("loc = %d, u=%f, v=%f\n", loc, u, v);
   DeCastel2(norm, Ndegu, Ndegv, u, v, &eval_N[loc*DIM]);
   Normalize(&eval_N[loc*DIM]);
   }
   }
   }

   // set the evaluated flag to be true
   evaluated = true;
   normal_flipped = false;
   */

  /* copy from plot patch */

  var geo = new THREE.Geometry();

  for(var i=0;i < size; i++)
    geo.vertices.push(new THREE.Vertex(eval_P[i]));

  var normal_flipped = false;
  for(var i=0;i< pts; i++) {
    for(var j=0;j < pts;j++)       // this loop will draw the quad strip:
    {

      var v1 = i*(pts+1)+j;
      var v2 = (i+1)*(pts+1)+j;
      var v3 = (i+1)*(pts+1)+j+1;
      var v4 = i*(pts+1)+j+1;
      if (v1 >= size || v2 >= size || v3>=size || v4 >= size){
          alert('error');
      }
      var face;
      if(!normal_flipped) { // reverse the orientation of the patch
          face = new THREE.Face4(v1,v2,v3,v4, [eval_N[v1],eval_N[v2],eval_N[v3],eval_N[v4]]);
          face.vertexColors = color_array(v1,v2,v3,v4,crv_array)
      }
      else {
          face = new THREE.Face4(v4,v3,v2,v1, [eval_N[v4],eval_N[v3],eval_N[v2],eval_N[v1]]);
          face.vertexColors = color_array(v4,v3,v2,v1,crv_array)
      }
      geo.faces.push(face);
    }
  }
  return geo;

}

function eval_control_mesh(degs,vecs){
  var     size;
  var     sizeu, sizev, bigstepu, bigstepv, degu, degv;

  degu = degs[0];
  degv = degs[1];

  var geo = new THREE.Geometry();

  size = (degu+1)*(degv+1);
  for(var i = 0; i < size; i++){
    geo.vertices.push(new THREE.Vertex(vecs[i].clone()));
  }

  var stepu = degu+1;
  for(var i = 0; i < degu; i++){
    for(var j = 0; j < degv; j++){
      var v1 = i*stepu+j;
      var v2 = (i+1)*stepu+j;
      var v3 = (i+1)*stepu+j+1;
      var v4 = i*stepu+j+1;
      geo.faces.push(new THREE.Face4(v1,v2,v3,v4));
      // console.log(v1,v2,v3,v4);
    }

  }

  return geo;

}


function init() {

    // console.log(bvstr);
  // geo.computeBoundingSphere();

  scene = new THREE.Scene();

  var patches = read_quad_bezier_from_string(bvstr);
  init_crv();
  for(var i = 0; i < patches.length; i++){
    var patch = patches[i];
    // console.log(patch);
    var geo = eval_patch([patch[0],patch[0]],patch[1],5);
//    var patch_material = new THREE.MeshPhongMaterial( { color: 0xff0000, specular:0xffffff, shininess:50, wireframe: false} );
    var patch_material = new THREE.MeshBasicMaterial( {  shading: THREE.SmoothShading, vertexColors: THREE.VertexColors, wireframe: false} );
    var patch_mesh = new THREE.Mesh( geo, patch_material );
    patch_mesh.doubleSided = true;
    patch_mesh.scale.set(0.5,0.5,0.5);
    scene.add( patch_mesh );
  
    var control_geometry = eval_control_mesh([patch[0],patch[0]],patch[1]);
    control_mesh = new THREE.Mesh( control_geometry,  new THREE.MeshBasicMaterial( { color: 0x000000, wireframe: true } ));
    control_mesh.doubleSided = true;
    control_mesh.scale.set(0.5,0.5,0.5);
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


function animate() {

  // note: three.js includes requestAnimationFrame shim
  controls.update();
  requestAnimationFrame( animate );
  render();

}

function render() {

  // mesh.rotation.x += 0.01;
  // mesh.rotation.y += 0.02;

  renderer.render( scene, camera );

}
