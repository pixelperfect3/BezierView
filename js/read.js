/* File for reading the BezierView format

   Author(s):
   -Ruijin Wu (@ruijin)
   -Shayan Javed (@pixelperfect3)
 */

/* 	TODO:
	-Implement for all 10 types
	-Incorporate new format? 
 */

/** The main read function **/
function read_patches_from_string(str){
	var parser = new bvFileParser(str);

	var patches = [];

	while(parser.hasNext()){
		// get the type
		var type = parser.nextInt();

		// figure out which one to parse
		switch(type){
			case 1: // polyhedron
				patches.push(read_polyhedron(parser));
				break;
			case 4:
			case 5:
			case 8:
				patches.push(read_tensor_product(type,parser));
				break;
			default:
				alert('unsupport format '+ type);
		}
	}
	return patches;
}

/** Handles polyhedron patch
    Type 1
	
	-Generates geometry directly
 **/
function read_polyhedron(parser) {
	// number of faces and vertices
	var numFaces, numVertices;

	numVertices = parser.nextInt();
	numFaces = parser.nextInt();
	

	// read all the vertices
	/*vertices = []
	for (var i = 0; i < numVertices; i++)
		vertices.push(read_vec3(parser));

	// all the faces
	// TODO: Currently inefficient. It is reading each vertex multiple times
	faces = []
	for (var i = 0; i < numFaces; i++) {
		var verts = parser.nextInt(); // how many vertices in that face?
		for (var j = 0; j < verts; j++)
			faces.push(vertices[parser.nextInt()]);
	}*/

	// Construct the geometry directly
	var geo = new THREE.Geometry();
	
	console.log("NumFaces: " + numFaces + ",verts: " + numVertices);
	
	// all the vertices
	for(var i = 0; i < numVertices; i++)
		geo.vertices.push(new THREE.Vertex(read_vec3(parser)));
		
	// all the faces
	for(var i = 0; i < numFaces; i++) {
		// TODO: For now can only handle faces with 3 or 4 vertices. Need to handle more?
		var verts = parser.nextInt();
		
		// vertex indices
		var v1, v2, v3, v4;
		v1 = parser.nextInt();
		v2 = parser.nextInt();
		v3 = parser.nextInt();
		
		if (verts == 4)
			v4 = parser.nextInt();
			
		// calculate face normal (not needed - THREE.js provides utility)
		/*var nv1 = new THREE.Vector4().sub(geo.vertices[v2].position, geo.vertices[v1].position);
		var nv2 = new THREE.Vector4().sub(geo.vertices[v3].position, geo.vertices[v1].position);
		var n = VVcross(nv2, nv1);
		var normal = new THREE.Vector3(n.x, n.y, n.z); // need to convert Vector4 to Vector3
		
		console.log("Normal: " + normal.x + "," + normal.y + "," + normal.z);*/
		
		if (verts == 3)
			geo.faces.push(new THREE.Face3(v1, v2, v3));//, normal));
		else // 4
			geo.faces.push(new THREE.Face4(v1, v2, v3, v4));//, normal));
	}
	
	geo.computeFaceNormals();
	geo.computeVertexNormals();
	
	return {"type": 1, "degs":[numFaces, numVertices], "pts": geo};
}

/** Handles tensor-product patches
  Types 4, 5 and 8 for now 
 **/
function read_tensor_product(type,parser){
	// The degree in the u and v directionm
	var degu,degv;

	if(type == 4){					// same degree in both directions
		degu = parser.nextInt();
		degv = degu;
	}
	else{							// type (5) and (8) - general patch and rational tensor-product
		degu = parser.nextInt();
		degv = parser.nextInt();
	}

	// read all the control points
	var vecs = [];
	for(var i = 0; i < (degu+1)*(degv+1); i++){
		if(type == 8){				// rational tensor-product: also has weight value 
			vecs.push(read_vec4(parser));
		}
		else{
			vecs.push(read_vec3(parser));
		}
	}

	return {"type":type,"degu": degu, "degv": degv, "pts":vecs};
}

// The parser object
bvFileParser = function(str){
	this.lines = str.split('\n');
	this.stream = [];
	for(var i = 0; i < this.lines.length; i++){
		var line = trim(this.lines[i]);
		if(line.length == 0)
			continue;
		var segs = trim(line).split(/\ +/);

		// append all the segments
		this.stream = this.stream.concat(segs);
	}
	this.currentPos = 0;
}

// Methods for the parser object
bvFileParser.prototype = {
constructor : bvFileParser,

	      hasNext : function(){
		      return this.currentPos < this.stream.length;
	      },

nextToken : function(){
		    var last = this.currentPos;
		    this.currentPos++;
		    return this.stream[last];
	    },

nextInt : function(){
		  return parseInt(this.nextToken());
	  },

nextFloat : function(){
		    return parseFloat(this.nextToken());
	    },
}

/** Utility functions **/
function read_vec3(parser){
	var x,y,z;
	x = parser.nextFloat();
	y = parser.nextFloat();
	z = parser.nextFloat();
	return new THREE.Vector4(x,y,z,1.0);
}

function read_vec4(parser){
	var x,y,z,w;
	x = parser.nextFloat();
	y = parser.nextFloat();
	z = parser.nextFloat();
	w = parser.nextFloat();
	return new THREE.Vector4(x,y,z,w);
}

// trims the string
function trim(str){
	return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}

// TODO: Old code which should be removed
// read function
function read_quad_bezier_from_string(str){
	var x,y,z,w;
	var lines = str.split('\n');
	// console.log(lines);

	var patches = [];

	//  for(var i = 1; i < lines.length; i++){
	var i = 0;
	while(i < lines.length){
		var vecs = [];
		var line = trim(lines[i]);

		if(line.length == 0){
			i++;
			continue;
		}

		var segs = trim(lines[i]).split(/\ +/);
		var deg;

		deg = parseInt(segs[1]);

		i++;
		//alert('reading patch of degree' + deg);
		var j = 0;
		while(j < (deg+1)*(deg+1)){
			line = trim(lines[i]);

			if(line.length == 0){
				i++;
				continue;
			}

			var coords = trim(line).split(/\ +/);

			x = parseFloat(coords[0]);
			y = parseFloat(coords[1]);
			z = parseFloat(coords[2]);

			if(coords.length > 3)
				w = parseFloat(coords[3]);
			else
				w = 1.0;
			vecs.push(new THREE.Vector4(x,y,z,w));
			j++;
			i++;
		}
		patches.push([deg,vecs]);
	}
	//  console.log(patches);
	return patches;
}
