/* File for reading the BezierView format */

// trims the string
function trim(str){
  return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}

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
