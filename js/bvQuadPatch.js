
bvQuadPatch = function(patch,parameters){
    parameters = parameters || {};

    this.renderMode = parameters.renderMode !== undefined ? parameters.renderMode: bvQuadPatch.Normal;
    this.subdivisionLevel = parameters.subdivisionLevel !== undefined ? parameters.subdivisionLevel : 5;
    this.color = parameters.color !== undefined ? new THREE.Color( parameters.color ) : new THREE.Color( 0xff1111 );
    this.ambient = parameters.ambient !== undefined ? new THREE.Color( parameters.ambient ) : new THREE.Color( 0x050505 );
    this.specular = parameters.specular !== undefined ? new THREE.Color( parameters.specular ) : new THREE.Color( 0xAAAAAA );
    this.shininess = parameters.shininess !== undefined ? parameters.shininess : 30;
    
    this.highlightLineColor = parameters.highlightLineColor !== undefined ? new THREE.Color( parameters.highlightLineColor ) : new THREE.Color( 0x116611 );

    // generate geometry
    var patch_geo = eval_patch([patch.degu,patch.degv],patch.pts,this.subdivisionLevel);
    patch_geo.dynamic = true;

    // generate material
    var attributes = {
	hr_val: {type: 'f', value: [] }
    };
    
    var uniforms = THREE.UniformsUtils.clone(bvshader.uniforms)

    var bvmaterial = new THREE.ShaderMaterial({
	uniforms: THREE.UniformsUtils.clone(bvshader.uniforms), //uniforms,
	attributes:     attributes,
	vertexShader:   bvshader.vertexShader, // document.getElementById( 'vertexshader' ).textContent,
	fragmentShader: bvshader.fragmentShader, // document.getElementById( 'fragmentshader' ).textContent,
	lights:true,
	vertexColors :THREE.VertexColors	
    });


    THREE.Mesh.call( this, patch_geo, bvmaterial );
    this.doubleSided = true;

    this.setRenderMode(this.renderMode);
    this.updateAttributes();
}

bvQuadPatch.Normal = 0;
bvQuadPatch.CurvatureColor = 1;
bvQuadPatch.HighlightLine = 2;
bvQuadPatch.ReflectionLine = 3;

bvQuadPatch.prototype = new THREE.Mesh();
bvQuadPatch.prototype.constructor = bvQuadPatch;

bvQuadPatch.prototype.getRenderMode = function(){
    return this.renderMode;
}

bvQuadPatch.prototype.setRenderMode = function(mode){


    if(this.renderMode == mode)
	return;

    this.renderMode = mode;

    switch(mode){
    case bvQuadPatch.HighlightLine:
    case bvQuadPatch.ReflectionLine:
	this.updateHighlight();
	break;
    }

    this.updateAttributes();
}

// recalcuate highlight line
// TODO: could be moved to pixel shader
bvQuadPatch.prototype.updateHighlight = function(){
    var highlightmode = this.renderMode == bvQuadPatch.HighlightLine? HIGHLIGHTLINE : REFLECTLINE;
    console.log(highlightmode);
    eval_highlight(highlightmode,this,this.material.attributes.hr_val.value);
    this.material.attributes.hr_val.needsUpdate = true;
}

// Should be called after change any of these values
bvQuadPatch.prototype.updateAttributes = function(){
    // phong color attribute
    this.material.uniforms.diffuse.value.copy(this.color);
    this.material.uniforms.ambient.value.copy(this.ambient);
    this.material.uniforms.specular.value.copy(this.specular);
    this.material.uniforms.shininess.value = this.shininess;

    this.material.uniforms.renderMode.value = this.renderMode;
    this.material.uniforms.highlightLineColor.value.copy(this.highlightLineColor);
}

bvshader = {

    uniforms: THREE.UniformsUtils.merge( [

	THREE.UniformsLib[ "common" ],
	//			THREE.UniformsLib[ "fog" ],
	THREE.UniformsLib[ "lights" ],
	//			THREE.UniformsLib[ "shadowmap" ],

	{
	    "ambient"  : { type: "c", value: new THREE.Color( 0xFF0505 ) },
	    "specular" : { type: "c", value: new THREE.Color( 0xFF1111 ) },
	    "shininess": { type: "f", value: 30 },
	    "wrapRGB"  : { type: "v3", value: new THREE.Vector3( 1, 1, 1 ) },
	    "renderMode": {type: "i" ,value: 2},
	    "highlightLineColor": {type: 'c', value: new THREE.Color(0x000000) }
	},
	// {
	// 	"renderMode": {type: "i" ,value: 1}
	// }
	

    ] ),

    vertexShader: [
	"varying vec3 vViewPosition;",
	"varying vec3 vNormal;",
	"varying float p_hr_val;",
	"attribute float hr_val;",
	//			THREE.ShaderChunk[ "map_pars_vertex" ],
	//			THREE.ShaderChunk[ "lightmap_pars_vertex" ],
	//			THREE.ShaderChunk[ "envmap_pars_vertex" ],
	THREE.ShaderChunk[ "lights_phong_pars_vertex" ],
	THREE.ShaderChunk[ "color_pars_vertex" ],
	//			THREE.ShaderChunk[ "skinning_pars_vertex" ],
	//			THREE.ShaderChunk[ "morphtarget_pars_vertex" ],
	//			THREE.ShaderChunk[ "shadowmap_pars_vertex" ],

	"void main() {",

	"vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",

	//				THREE.ShaderChunk[ "map_vertex" ],
	//				THREE.ShaderChunk[ "lightmap_vertex" ],
	//				THREE.ShaderChunk[ "envmap_vertex" ],
	THREE.ShaderChunk[ "color_vertex" ],

	"#ifndef USE_ENVMAP",

	"vec4 mPosition = objectMatrix * vec4( position, 1.0 );",

	"#endif",

	"vViewPosition = -mvPosition.xyz;",

	"vec3 transformedNormal = normalMatrix * normal;",
	"vNormal = transformedNormal;",

	THREE.ShaderChunk[ "lights_phong_vertex" ],
	//				THREE.ShaderChunk[ "skinning_vertex" ],
	//				THREE.ShaderChunk[ "morphtarget_vertex" ],
	THREE.ShaderChunk[ "default_vertex" ],
	//				THREE.ShaderChunk[ "shadowmap_vertex" ],
	"p_hr_val = hr_val;",

	"}"

    ].join("\n"),

    fragmentShader: [

	"uniform vec3 diffuse;",
	"uniform float opacity;",

	"uniform vec3 ambient;",
	"uniform vec3 specular;",
	"uniform float shininess;",

	"uniform vec3 highlightLineColor;",
	"uniform int renderMode;",

	THREE.ShaderChunk[ "color_pars_fragment" ],
	//			THREE.ShaderChunk[ "map_pars_fragment" ],
	//			THREE.ShaderChunk[ "lightmap_pars_fragment" ],
	//			THREE.ShaderChunk[ "envmap_pars_fragment" ],
	//			THREE.ShaderChunk[ "fog_pars_fragment" ],
	THREE.ShaderChunk[ "lights_phong_pars_fragment" ],
	//			THREE.ShaderChunk[ "shadowmap_pars_fragment" ],
	"varying float p_hr_val;",
	"void main() {",

	"gl_FragColor = vec4( vec3 ( 1.0 ), opacity );",

	//				THREE.ShaderChunk[ "map_fragment" ],
	THREE.ShaderChunk[ "alphatest_fragment" ],
	"if(renderMode != 1){", // not curvature mode
	THREE.ShaderChunk[ "lights_phong_fragment" ],
	"  if(renderMode == 2 || renderMode == 3){",
	"    float temp = fract(p_hr_val);",

	"    if(temp > 1.0/3.0 && temp < 2.0/3.0){",
	"      gl_FragColor = vec4(highlightLineColor,1.0);",
	"    }",
	"  }",

	
	"}",
	//				THREE.ShaderChunk[ "lightmap_fragment" ],
	"else if(renderMode == 1){", // curvature render
	THREE.ShaderChunk[ "color_fragment" ],
	"}",
	
	//				THREE.ShaderChunk[ "envmap_fragment" ],
	//				THREE.ShaderChunk[ "shadowmap_fragment" ],

	//				THREE.ShaderChunk[ "linear_to_gamma_fragment" ],

	//				THREE.ShaderChunk[ "fog_fragment" ],

	"}"

    ].join("\n")

}