function ProjectVTCDataOnMesh(mtcName)
{
	var ok;
	var docVMR = BrainVoyager.ActiveDocument;
	if(docVMR == undefined) return;
	var mesh = docVMR.CurrentMesh;
	if(mesh == undefined) return;

	ok = mesh.CreateMTCFromVTC(-1.0, 2.0, mtcName);
	if(!ok)
		BrainVoyager.PrintToLog("Could not create MTC data from VTC data.");
}


var baseDir = BrainVoyager.BrowseDirectory('Please select the consolidated output directory:');
var bDir = new QDir(baseDir);

/*
var el = bDir.entryList([".txt"]);
if(el.length == 0){
	BrainVoyager.PrintToLog("Error: no list file found. Exiting.");
}

var listFile = new QFile(baseDir + "/" + el[0]);
mcFile.open(new QIODevice.OpenMode(QIODevice.ReadOnly));
var is = new QTextStream(mcFile);
var mcf = is.readLine();
if(mcf){
			this.mCorrTarget = mcf;
*/

var vtcs = bDir.entryList(["*.vtc"]);
if(vtcs.length == 0){
	BrainVoyager.PrintToLog("ERROR: No VTC files found. Exiting.");
	return;
}
var srfs = bDir.entryList(["*.srf"]);
if(srfs.length == 0){
	BrainVoyager.PrintToLog("ERROR: No SRF files found. Exiting.");
	return;
}
var vmrs = bDir.entryList(["*.vmr"]);
if(vmrs.length == 0){
	BrainVoyager.PrintToLog("ERROR: No VMR files found. Exiting.");
	return;
}

//loop over all VMRs, create list of indices in VTC list matching subject ID, 
//open VMR, load matching SRF, link each VTC and create MTC
for(var i = 0; i < vmrs.length; i++){
	var subjID = vmrs[i].substr(0, vmrs[i].indexOf("-"));
	BrainVoyager.PrintToLog("Got subject ID: " + subjID);
	matchInds = [];

	//get list of indices in VTC list matching subject ID
	for(var v = 0; v < vtcs.length; v++){
		if(vtcs[v].indexOf(subjID) >= 0){
			BrainVoyager.PrintToLog("Matching VTC: " + vtcs[v]);
			matchInds.push(v);
		}
	}

	BrainVoyager.PrintToLog("Found " + matchInds.length + " VTCs for this subject");

	if(matchInds.length == 0){
		BrainVoyager.PrintToLog("No VTCs for this subject - skipping");
		continue;
	}

	//get this subject's mesh files
      var subjSrfL = "";
	var subjSrfR = "";
	for(var s = 0; s < srfs.length; s++){
		if(srfs[s].indexOf(subjID) >= 0){
			if(srfs[s].indexOf("_HIRES_SPH") >= 0){
				if(srfs[s].indexOf("_lh_") >= 0){
					BrainVoyager.PrintToLog("Got LH mesh: " + srfs[s]);
					subjSrfL = baseDir + "/" + srfs[s];
				}
				else if(srfs[s].indexOf("_rh_") >= 0){
					BrainVoyager.PrintToLog("Got RH mesh: " + srfs[s]);
					subjSrfR = baseDir + "/" + srfs[s];
				}
			}
		}
	}

	//load in VMR
	var curVMR = BrainVoyager.OpenDocument(baseDir + "/" + vmrs[i]);
	
	//load left mesh
	curVMR.LoadMesh(subjSrfL);
	BrainVoyager.PrintToLog("Left mesh loaded!");

	//loop over VTCs - link each to create MTC
	for(v = 0; v < matchInds.length; v++){
		BrainVoyager.PrintToLog("Linking VTC: " + vtcs[matchInds[v]]);
		curVMR.LinkVTC(baseDir + "/" + vtcs[matchInds[v]]);
		var mtcName = vtcs[v].substr(0, vtcs[matchInds[v]].length-4) + "_LH.mtc";
		ProjectVTCDataOnMesh(mtcName);
	}

	//load right mesh
	curVMR.LoadMesh(subjSrfR);
	BrainVoyager.PrintToLog("Right mesh loaded!");

	//loop over VTCs - link each to create MTC
	for(v = 0; v < matchInds.length; v++){
		BrainVoyager.PrintToLog("Linking VTC: " + vtcs[matchInds[v]]);
		curVMR.LinkVTC(baseDir + "/" + vtcs[matchInds[v]]);
		mtcName = vtcs[v].substr(0, vtcs[matchInds[v]].length-4) + "_RH.mtc";
		ProjectVTCDataOnMesh(mtcName);
	}

	curVMR.Close();
	BrainVoyager.PrintToLog("All MTCs created for " + subjID);
}




