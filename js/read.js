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
		//console.log("Type: " + type);
		
		// figure out which one to parse
		switch(type){
			case 1: 									// polyhedron
				patches.push(read_polyhedron(parser));
				break;
			case 3:										// triangular bezier
				patches.push(read_triangular(parser));
				break;
			case 4: 									// tensor-product
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

	// Construct the geometry directly
	var geo = new THREE.Geometry();

	//console.log("NumFaces: " + numFaces + ",verts: " + numVertices);

	// all the vertices
	for(var i = 0; i < numVertices; i++)
		geo.vertices.push(new THREE.Vertex(read_vec3(parser)));

	// all the faces
	for(var i = 0; i < numFaces; i++) {
		// TODO: For now can only handle faces with 3 or 4 vertices. Need to handle more?
		var verts = parser.nextInt();

		// vertex indices
		var v1 = parser.nextInt();
		var v2 = parser.nextInt();
		var v3 = parser.nextInt();

		if (verts == 3)
			geo.faces.push(new THREE.Face3(v1, v2, v3));
		else { 				// 4
			var v4 = parser.nextInt();
			geo.faces.push(new THREE.Face4(v1, v2, v3, v4));
		}
	}

	// compute normals
	geo.computeFaceNormals();
	geo.computeVertexNormals();

	return {"type": 1, "geometry": geo};
}


/** Handles triangular bezier patches
	Type 3
 **/
function read_triangular(parser) {
	// The degree
	var deg;

	deg = parser.nextInt();
	//console.log("Degree: " + deg);
	
	// read all the control points
	var vecs = [];
	for(var i = 0; i < ((deg+2) * (deg+1)/2); i++) {
		vecs.push(read_vec3(parser));	
	}

	//console.log(vecs);
	
	return {"type":3,"deg":deg,"pts":vecs};
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

	return {"type":type,"degu":degu, "degv":degv, "pts":vecs};
}

// The parser object
bvFileParser = function(str){
	this.lines = str.split('\n');
	this.stream = [];
	for(var i = 0; i < this.lines.length; i++){
		var line = trim(this.lines[i]);
		if(line.length == 0)
			continue;
		var segs = trim(line).split(/\s+/);

		// append all the segments
		this.stream = this.stream.concat(segs);
	}
	//console.log(this.stream);
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
		    this.currentPos = this.currentPos + 1;
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
	//console.log("X = " + x  + ", Y = " + y + ", Z = " + z);
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

