/** Calculates the highlight/reflection lines**/

/** Author(s):
  Ruijin (@ruijin)
 **/

var hl_error;
var hl_step = 5.0;
var HIGHLIGHTLINE = 0;
var REFLECTLINE = 1;


function calc_D(P, N, A, H){
	// // according to Beier/Chen's 1994 CAD paper
	/*

	   [ H X N(u,v)] dot [A - P(u,v)]
	   D(u,v) = --------------------------------
	   || H X N(u,v) ||
	   N and P are normals and locations on the surface at (u,v)
	   H is the normalized direction of the light source line
	   A is the starting point of the light source line

	 */

	var SA = new THREE.Vector4();
	var m;
	var div;

	SA.sub(A,P);

	var temp = VVcross(H, N);
	div = temp.length();    // according to Beier/Chen's 1994 CAD paper
	var tol = 0.0001;
	if(Math.abs(div)< tol)
	{
		//		printf("Warning: divided by zero\n");
		hl_error = 1;
		return 0;
	}
	else {
		hl_error = 0;
		//return (VVmult(temp,SA) / div);
		//console.log(div);
		return temp.dot(SA)/div;
	}
}

//
function calc_ref_line(P, N, A, H, eye)
{
	var RefN ;
	var th;
	// TODO: should double check here @ruijin
	var  SA = new THREE.Vector3();

	SA.sub(A,P);

	SA.divideScalar(SA.length()); 
	th = SA.dot(N);
	//    console.log(th);
	RefN = N.clone().multiplyScalar(2*th).subSelf(SA);

	return calc_D( P, RefN, A, H);
}

// determinent for a 4x4 matrix
function det4(  x11,  x12,  x13,  x14,
		x21,  x22,  x23,  x24,
		x31,  x32,  x33,  x34,
		x41,  x42,  x43,  x44)
{
	var t0 = x11*x22*x33*x44-x11*x22*x34*x43-
		x11*x32*x23*x44+x11*x32*x24*x43+x11*x42*x23*x34-
		x11*x42*x24*x33-x21*x12*x33*x44+x21*x12*x34*x43+
		x21*x32*x13*x44-x21*x32*x14*x43-x21*x42*x13*x34+
		x21*x42*x14*x33+x31*x12*x23*x44-x31*x12*x24*x43-
		x31*x22*x13*x44+x31*x22*x14*x43+x31*x42*x13*x24-
		x31*x42*x14*x23-x41*x12*x23*x34+x41*x12*x24*x33+
		x41*x22*x13*x34-x41*x22*x14*x33-x41*x32*x13*x24+
		x41*x32*x14*x23;
	return t0;
}


// solve a 4x4 linear system
// i.e. Ay=x where A is a 4x4 matrix, x is a length 4 vector
//
// USED for: solving the correct light source direction after rotation.
//  i.e. A : current modelview matrix,
//       x : initial light source
//    return x: current light source
function Solve4(A, x)
{
	var B = new Array(16);
	var i,j;
	var y = new Array(4);
	var det, dem;

	det = det4( A[0], A[4], A[8], A[12],
			A[1], A[5], A[9], A[13],
			A[2], A[6], A[10], A[14],
			A[3], A[7], A[11], A[15]);

	for(i=0;i<4;i++) {
		for(j=0;j<16;j++)
			B[j] = A[j];

		for(j=0;j<4;j++)
			B[i*4+j] = x[j];

		dem = det4( B[0], B[4], B[8], B[12],
				B[1], B[5], B[9], B[13],
				B[2], B[6], B[10], B[14],
				B[3], B[7], B[11], B[15]);
		y[i] = dem/det;
	}

	for(i=0;i<4;i++)
		x[i] = y[i];
}


function calc_HA(patch,A,H) {
	var array_A = [0.0,  0.0, 40.0, 1.0];
	var array_H = [0.0,  1.0,  0.0, 0.0];
	var mv_matrix = new Array(16);
	var eye = new THREE.Vector4(0, 0, 1000,1);

	if(patch._modelViewMatrix == undefined){
		var temp_matrix = new THREE.Matrix4();
		temp_matrix.flattenToArray(mv_matrix);
	}
	else
		patch._modelViewMatrix.flattenToArray(mv_matrix);


	Solve4(mv_matrix, array_A);
	Solve4(mv_matrix, array_H);

	A.set(array_A[0],array_A[1],array_A[2],array_A[3]);
	H.set(array_H[0],array_H[1],array_H[2],array_H[3]);
}

////////////////////////////////////////////////////////////////
//
//  plot the high light
//

function eval_highlight(highlight_type, patch, funcs) {
	var eye = new THREE.Vector4(0, 0, 1000,1);

	var A = new THREE.Vector4();
	var H = new THREE.Vector4();

	calc_HA(patch,A,H);

	// calculate the highlight values according to point and normal
	for(var i = 0; i < patch.geometry.faces.length; i++)
	{
		var face = patch.geometry.faces[i];
		var ids = [face.a,face.b,face.c,face.d];
		for (var j = 0; j < 4; j++){
			var N = face.vertexNormals[j];
			var P = patch.geometry.vertices[ids[j]].position.clone();
			if(highlight_type == HIGHLIGHTLINE) {
				func = calc_D( P, N, A, H)/hl_step;
				//if (calc_D( &P[i*DIM], &N[i*DIM], A, H, &func[i]))
				if (hl_error){
					console.log('hl_error');
					return; // return if the patch is numerically unstable,
				}

			}
			else {
				func = calc_ref_line( P, N, A, H, eye)/hl_step;
				//if (calc_ref_line( &P[i*DIM], &N[i*DIM], A, H, eye, &func[i]))
				if (hl_error){
					console.log('hl_error');
					return; // return if the patch is numerically unstable,
				}
			}
			funcs[ids[j]] = func;
		}

	}
}

