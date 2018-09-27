## Data Processing Pipeline for STS Project
***Latest Revision 9/25/18 by @pitchaim***

***

### Contents
#### [Pipeline organization](#org)
#### [Function reference](#funcref)
#### [Parameters](#params)
#### [Original pipeline description](#origdesc)

### Installation
1. Clone/download repository to desired location.
2. Locate BrainVoyager's `BVExtensions` directory and note path.
3. Run `sudo chmod u+x install.sh`
4. Run install.sh as sudo: `sudo ./install.sh <path-to-BVExtensions`

### Pipeline organization<a name="org"></a>
**Main Steps & Functions**
1. Organize downloaded data with helper scripts:
   - Run `renameDicom.m` to rename session directories & their sub-directories correctly
   - Run `clean_unfiltered` to put all unfiltered "duplicate" run directories in `Unfiltered_Raw` sub-directory
   - Locate the task/volume reference file `STS-R21-Volume-Reference.txt` and note its full path - this will be used to check that the correct number of volumes is found in each BOLD run
2. Run pipeline script (modified COPE) to preprocess data:
   - First use: make a backup of `.../BVExtensions/Plugins_64/COPE_v10.js`, then copy `BrainVoyager-Analysis-Tools/BV-Scripts/COPE_v10.js` to `.../BVExtensions/Plugins_64/`
   - Open `.../BVExtensions/Plugins_64/COPE_v10.js` for editing.
   - Specify the full path to `STS-R21-Volume-Reference.txt` as the value of `o.volRefFileName` so the script can check for proper number of volumes in BOLD runs.
   - Specify a match string for the FMR filename of the opposite phase run to be used for VDM estimation in COPE (e.g. `*PA*TH3Pc.fmr`) as the first value of `o.vdmEstimate`, ensuring that the match string ends with `TH3Pc.fmr` so that the motion-corrected and high-pass-filtered version of that file will be used. 
   - Give a name for the text file where the filename of the run used as the motion correction and VDM estimation target will be written. This is both an internal processing step and a QA check - the filename can be checked to ensure it is correct (it should be the run immediately after FieldMap), and will persist if the pipeline is interrupted.
   - Specify all parameters for COPE (see [Parameters](#parameters) for detail; all can be left as repository defaults except possibly `o.use_ic` for spin echo vs. gradient echo)
   - Do not change any other parameters!
   - Save your changes and exit.
   - Open BrainVoyager and run `Plugins` -> `COPE (v1.0)`
   - On the `CMU Pipeline` tab, click `Select home directory and start processing` - this will open a GUI prompt to select the session directory to process. Once a directory has been selected, processing will begin automatically. The following steps will occur, while detailed information about each step is printed to the BrainVoyager Log tab:
      - Create subdirectory `_BV-<sessionName>` where `<sessionName>` is the name of the directory being processed.
      - Create FMR files for each `BOLD` directory (i.e. run), skipping any with too few volumes, writing all FMRs to the `_BV-` subdirectory.
      - Find first `BOLD` run following `FieldMap` and set this as the motion correction and VDM estimation target. Write this run name to text file in `_BV-` directory (name of this file specified as parameter by user, see above)'
      - Run motion correction, using sinc interpolation, on all base FMR files, creating a copy of each `.fmr` file with `3DMCS` appended to the filename.
      - Run high-pass filtering on all motion-corrected FMR files, creating a copy of each `3DMCS` file with `TH3Pc` appended to the filename.
      - As QA step, write out a list of all `_3DMCS_LTR_TH3Pc` FMR files to `FMRlist.txt` in the `_BV-` subdirectory.
      - Estimate VDM using run specified as the first value of `o.vdmEstimate` and the motion correction target run.
      - Execute COPE - apply VDM to all `_3DMCS_LTR_TH3Pc` FMR files to undistort.
      - Look for `MPRAGE` run in base directory - if found, create VMR file and write to `_BV-` subdirectory.
   - After script has completed, copy the entire contents of the BrainVoyager log and save them to the current session's `_BV-` subdirectory as `Pipeline-BrainVoyager-Log-Output.txt`.
   - On completion, all preprocessed data from the selected session will be in that session's `_BV-` subdirectory. 
   - The final, preprocessed FMR files will have the filename ending `_3DMCS_LTR_TH3Pc_undist.fmr`
3. _Some sort of quality check would probably be good at this stage._ 
4. If a new subject, run Freesurfer `recon-all` on MPRAGE from Session-1.
   - Potentially clean up the final generated surfaces
5. Convert Freesurfer output to BrainVoyager using: [Freesurfer-to-BrainVoyager](https://github.com/tarrlab/Freesurfer-to-BrainVoyager)
   - Make sure this output is in the correct location and the conversions were correct
6. Run BBR script.
   - After running the preprocessing script (i.e. all processes which were invoked via the `Select home directory and start preprocessing` button have completed), [reframe the `*Anat_Unframed` VMR file](#vmrframe).
   - To run BBR, click the `Run BBR` button on the `CMU pipeline` tab. This will run the following steps:
      - If the pipeline has been interrupted (i.e. the plugin has been closed since preprocessing was run on this dataset), you will be prompted to select the base subject directory again so that path references can be set properly.
      - Open the re-framed VMR file
      - Create VMR for BBR from FMR used as motion correction target
      - Run BBR, generating initial (`*IA.trf`) and final (`*FA.trf`) alignment files in `_BV-` subdirectory
7. [Make Bounding Box file](#bbx)
8. Generate session list file
   - Once you have created and saved the Bounding Box file (`.bbx`), click the `Check and Create Session List File` button on the `CMU pipeline` tab. This will generate a session list file in the format expected by the function for VTC creation (next step). If the pipeline has been interrupted (i.e. the plugin has been closed since BBR was run on this dataset), you will be prompted to select the base subject directory again so that path references can be set properly.
   - After this is complete, verify that everything in the file (`<subjID>-SessionList.txt`) is correct. There should be a number (count of all listed filenames following), a list of all valid FMR filenames plus `IA.trf`, `FA.trf` and the re-framed anatomical VMR, and finally the contents of the `.bbx` file.
9. Create VTCs
   - Once the Session List file has been generated correctly, click `Create VTCs` on the `CMU pipeline` tab to create VTCs for each FMR.
   - After this has completed, one VTC per FMR should be written to the `_BV-` subdirectory.
   - Additional notes:
   - BBR should be performed using the "Master" VMR made in BV from the MPRAGE collected in Session-1
      - So the VMR will either need to come from the script in Step 2, or be referenced in some way. It might make sense to just put a copy in each _BV directory for Sessions 2-4, which would make it easy.
   - BBR will use a combined left and right hemisphere surface converted from Freesurfer instead of using the "Automatic Cortex Segmentation For BBR" tool in BV. 
      - The Freesurfer output is split by hemispheres. We need to see if there is a way to script combining meshes in BV. I only know how to do this in the GUI.  
   - VTC creation will requite a Bounding Box .bbx file. This will almost certainly have to be done manually. The same .bbx file will be used for all sessions.
   - Protocol files will also need to be attached to FMR files at some point. I think we have decided that all necessary protocol files will live in the _BV directory (instead of being referenced in some other directory). So this could either be automated or done manually.
   - Script to perform MTC creation:
      - `MTCcreator.js` will batch-create MTCs given a directory of VMRs, VTCs, and SRFs from the same subjects. To use this, place in `.../BVExtensions/Scripts/` and run from BV script editor (`Scripts -> Edit and Run Scripts...`).


**NOTE: After BBR and VTC creation, this check should be performed**
**Check first VTC is properly created and coregistered**
1. Menu: `Analysis --> Link Volume Timecourse files (VTC)`
2. Select first VTC file created
3. Open `3D Volume Tools`
4. Select `Spatial Transf` tab
5. Push `Show VTC Volume 1` button
     - This will render the first functional volume of the VTC to the 3-pane display
6. Check co-registration by flipping back and forth using `Show primary VMR` and `Show secondary VMR` buttons
     - F8 (on Mac) will flip back and forth quickly
     - F9 will cycle through different overlay options



### Function reference<a name="funcref"></a>
1. [`o.selectHomeDirAndProcess`](#selecthomedirandprocess)
2. [`o.makebvdir`](#makebvdir)
3. [`o.readVolRef`](#readvolref)
4. [`o.createFMRs`](#createfmrs)
5. [`o.preprocess_fmrs`](#preprocess_fmrs)
6. [`o.createFMRList`](#createfmrlist)
7. [`o.estimate`](#estimate)
8. [`o.vdmBrowse`](#vdmbrowse)
9. [`o.apply`](#apply)
10. [`o.updateList`](#updatelist)
11. [`o.create_vmr`](#create_vmr)
12. [`o.runBBR`](#runbbr)
13. [`o.createSessionListFile`](#createsessionlistfile)
14. [`o.createVTCs`](#createvtcs)
15. [`o.strip_name`](#strip_name)
16. [`o.findVolRef`](#findvolref)
17. [`o.getFileFromPath`](#getfilefrompath)

**o.selectHomeDirAndProcess**<a name="selecthomedirandprocess"></a>
- Pipeline function - calls other functions to perform data preprocessing on one session folder.

`inputs` none

`return values` none

`prerequisites`:
- define `o.volRefFileName` as full path to volume reference file
- define `o.vdmEstimate[0]` as match string for opposite-phase VDM estimation target file
- define `o.mCorrTargetFileName` as desired filename to write name of motion correction target run

`effects`:
- create `_BV-` sub-directory in chosen session directory
- preprocessed FMR files for all `BOLD` runs in session directory (motion-corrected, high-pass filtered, COPE-undistorted), written to `_BV-` subdir
- VMR file for any `MPRAGE` run found in session directory, written to `_BV-` subdir
- List of FMR filenames `FMRlist.txt` - preprocessed (`_3DMCS_LTR_TH3Pc.fmr`) if motion correction and HPF done before COPE, else undistorted only (`_undist.fmr`), written to `_BV-` subdir
- Name of run used as motion correction target written to file in `_BV-` subdir, name specified as value of `o.mCorrTargetFileName`

**o.makeBVdir**<a name="makebvdir"></a>
- Creates `_BV-` subdirectory in base session folder.

`inputs` none

`return values` none

`prerequisites`:
- Select base session directory via GUI (will be opened for you if using pipeline via plugin)

`effects`:
- Creates `_BV-` subdirectory


**o.readVolRef**<a name="readvolref"></a>
- Read in volume reference file to set expected # runs for each functional task.

`inputs` none

`return values` none

`prerequisites`:
- Have a copy of master volume reference file saved on system, define path to it as `o.volRefFileName`

`effects`:
- Sets `o.taskIDs` and `o.taskVols` as (respectively) a list of functional scan name identifier substrings (as input at SIBR, e.g. 'MTLocal' for MT localizer) and a list of the expected number of volumes for those scan names, in the same order.


**o.createFMRs**<a name="createfmrs"></a>
- Creates an FMR file for each BOLD run found in base session directory, writing all to the `_BV-` subdirectory along with several "manifest" log files.

`inputs` none

`return values` none

`prerequisites`:
- Home directory must have been selected, or `o.hDir` set as the path to base session directory
- `_BV-` subdirectory must exist

`effects`:
- Sets internal variable `o.numFMRs` as the total number of BOLD runs
- Looks for first BOLD run immediately following the second run named "*_FieldMap_*" and sets that run as the motion correction target
- Checks number of DICOM files in each BOLD directory against `o.taskVols` to ensure each functional (task) run has the correct number of volumes; incomplete runs will be skipped and will not be written as an FMR
- Creates an FMR file for each complete BOLD run, writing FMRs to `_BV-` subdirectory; hard-coded parameters `slices = 69`, `mosaicX,Y = 954,954`, `nrBytes = 2`, `volumes per DICOM = 1`, `resolutionX,Y = 106,106`
- Sets internal variable `o.fmrList` as an array of all FMR filenames currently in `_BV-` subdirectory
- Sets internal variable `o.mCorrTarget` as filename (including path) of motion correction target FMR 
- Writes path and filename of motion correction target FMR to text logfile whose name is specified as `o.mCorrTargetFileName`


**o.preprocess_fmrs**<a name="preprocess_fmrs"></a>
- Runs motion correction with sinc interpolation and high-pass filtering on all FMRs in `_BV-` subdirectory.

`inputs` none

`return values` none

`prerequisites`:
- `_BV-` subdirectory exists
- All FMR files you want to preprocess are written to `_BV-` subdirectory
- `o.numFMRs` is set to the correct number of FMR files in `_BV-` subdirectory
- `o.fmrList` is set as an array of FMR filenames to process
- `o.mCorrTarget` is set to name of motion correction target FMR, or text file (name set as `o.mCorrTargetFileName`) with full path to, and name of, motion correction target is in `_BV-` subdirectory

`effects`:
- Motion-corrects all specified FMRs, using sinc interpolation, to the specified target FMR (first run following FieldMap), writing results to `_BV-` subdirectory - all FMR filenames will be tagged "_3DMCS"
    - hard-coded parameters: `target volume = 1`, `interpolation = 3 (sinc)`, `use full dataset = 1`, `max iterations = 100`, `create movies = 0`, `write extended log = 1`
- High-pass filters all specified FMRs using sinc interpolation, writing results to `_BV-` subdirectory - all FMR filenames will be tagged "_THP3c"
    - hard-coded parameters: `interpolation = 3 (sinc)`, `unit = cycles`
- Each FMR will be duplicated, with additive tagging for each of these steps (i.e. FMRs which have only been motion-corrected will be tagged "_3DMCS", while FMRs which have been both motion-corrected and high-pass filtered will be tagged "_3DMCS_THP3c"
- `o.preprocComplete` flag set to `true`


**o.createFMRList**<a name="createfmrlist"></a>
- Write out a list of the most recently-created FMR filenames to `_BV-<session>/FMRList.txt`

`inputs` none

`return values` none

`prerequisites`:
- `_BV-` subdirectory exists

`effects`:
- Looks for all FMR filenames in `_BV-` subdirectory and creates a list. If preprocessing has been complete, looks only for FMR filenames ending with `THP3c.fmr`, else looks for filenames ending with `.fmr`
- Sets `o.fmrList` as new array of FMR filenames
- Sets `o.fmrListString` as newline-delineated string of all FMR filenames (required for VDM estimation)
- Writes FMR filenames, one per line, to text file `FMRList.txt` in `_BV-` subdirectory.


**o.estimate**<a name="estimate"></a>
- Calls COPE to estimate VDM using motion correction target FMR and opposite phase-encoded BOLD FMR, creating vdm.map file

`inputs` none

`return values` none

`prerequisites`:
- `_BV-` subdirectory exists
- Define all required [Parameters](#parameters) for COPE
- Motion correction target FMR filename defined as `o.mCorrTarget` or written to text file

`effects`:
- sets `o.vdmEstimate[1]` as run name of motion correction target
- calls COPE to estimate VDM from opposite phase-encoded BOLD run (PA, specified as parameter) and motion correction target FMR

**o.vdmBrowse**<a name="vdmbrowse"></a>
- Looks for VDM map file and loads its name into `o.vdmFile`

`inputs` none

`return values` none

`prerequisites`:
- `_BV-` subdirectory exists
- `o.vdmEstimate[1]` is defined, or `o.mCorrTargetFileName` is set as the path to a text file containing the name of the motion correction target FMR
- `o.estimate` has been called or the `.vdm` file for the motion correction target FMR (AP phase-encoded) is already in the `_BV-` subdirectory

`effects`:
- sets `o.vdmEstimate[1]` as run name of motion correction target

**o.apply**<a name="apply"></a>
- Calls COPE to apply the VDM map transform (i.e. distortion correction) to all preprocessed FMR files

`inputs` none

`return values` none

`prerequisites`:
- `_BV-` subdirectory exists
- Define all required [Parameters](#parameters) for COPE
- Motion correction target FMR filename defined as `o.mCorrTarget` or written to text file
- `FMRList.txt` contains a line-separated list of all preprocessed FMR files, and is in the `_BV-` subdirectory
- `o.vdmFile` is correctly set as the name of the `.vdm` file for the motion correction target

`effects`:
- Sets `o.fmrListString` as a newline-separated string of all preprocessed FMR filenames
- calls COPE to apply the `.vdm` map file to all preprocessed FMRs

**o.updateList**<a name="updatelist"></a>
- Updates list of FMR files to reflect COPE `_undist` tag

`inputs` none

`return values` none

`prerequisites`:
- `_BV-` subdirectory exists
- `o.fmrList` is correctly set as the array of preprocessed FMR filenames

`effects`:
- Updates each entry in `o.fmrList` with `_undist` tag to reflect COPE correction
- Writes new list out to `FMRlist_processed.txt` in `_BV-` subdirectory

**o.create_vmr**<a name="create_vmr"></a>
- Creates VMR if anatomical run found

`inputs` none

`return values` none

`prerequisites`:
- `_BV-` subdirectory exists

`effects`:
- Looks for a run with either `MPRAGE` or `mpr_sag` in the name, creates a VMR file, and writes VMR to `_BV-` subdirectory. If no anatomical run found, does nothing.

**o.runBBR**<a name="runbbr"></a>
- Coregisters VMR to motion correction target FMR using **B**oundary-**B**ased **R**egistration 

`inputs` none

`return values` none

`prerequisites`:
- `_BV-` subdirectory exists
- Basic preprocessing has been completed:
    - All FMR files have been motion-corrected, high-pass filtered, and COPE-corrected
    - `o.mCorrTarget` is correctly set to the name of the motion correction target FMR, or `o.mCorrTargetFileName` is correctly set to the path of the text file where the name of the motion correction target FMR is written
    - The re-framed VMR file `*Anat.vmr` has been created and is in the `_BV-` subdirectory
- Merged `.srf` and `.vwp` files `*_Merged_smoothwm.srf` (from Freesurfer output) and `*_Merged_smoothwm.vwp` are in the `_BV-` subdirectory

`effects`:
- Renames white-matter surface files `STSX-Merged_smoothwm.srf` and `STSX-Merged_smoothwm.vwp` to `STSX-Anat_ETC-7x-R5_WM_RECOSM_D300k.srf` and `STSX-Anat_ETC-7x-R5_WM_RECOSM_D300k.vwp`, respectively
- Creates VMR for BBR from motion correction target FMR
- Coregisters motion correction target FMR and VMR using white-matter surface files
- Creates IA and FA transformation (`.trf`) files to fit FMR to VMR
- Sets `o.iaFile` and `o.faFile` as the paths to, and names of, the IA and FA transformation files

**o.createSessionListFile**<a name="createsessionlistfile"></a>
- Dumps session filenames, info, and bounding box contents into one text file

`inputs` none

`return values` none

`prerequisites`:
- `_BV-` subdirectory exists
- Basic preprocessing has been run completely
    - Processed names of all FMRs stored in `o.fmrList` or in file `-BV-STSX/FMRlist_processed.txt`
    - VMR file created, in `_BV-` subdirectory
    - Bounding box file has been created (extension `.bbx`)
    - BBR has been run
        - IA and FA `.trf` files in `_BV-` subdirectory

`effects`:
- Creates text file `STSX_SessionList.txt` which contains names of all FMRs, VMR, `.trf` files and bounding box contents

**o.createVTCs**<a name="createvtcs"></a>
- Creates VTC for each processed FMR

`inputs` none

`return values` none

`prerequisites`:
- `_BV-` subdirectory exists
- Basic preprocessing complete
- BBR has been run
- Session list file `STSX_SessionList.txt` has been correctly generated

`effects`:
- Creates VTC file in FMR space for each processed FMR; hard-coded parameters: `data type = 2 (float)`, `resolution = 2(mm)`, `interpolation = 2 (sinc)`, `threshold = 100 (if no bbx)`

**o.strip_name**<a name="strip_name"></a>
- Cuts `##_BOLD_` from directory name

`inputs` run directory name

`return values` trimmed directory name

`prerequisites` none

`effects`: none

**o.findVolRef**<a name="findvolref"></a>
- Find index into `o.taskIDs` of a task name matching a run directory name

`inputs` run directory name

`return values` index into `o.taskIDs` for the task matching that run, -1 if not found

`prerequisites` `o.readVolRef` has been called to read in the volume reference file and set `o.taskIDs`

`effects`: none

**o.getFileFromPath**<a name="getfilefrompath"></a>
- Given a full path, extract the filename

`inputs` absolute path

`return values` filename and extension

`prerequisites` none

`effects`: none

### Parameters<a name="parameters"></a><a name="params"></a>

#### Internally manipulated values
* **o.numFMRs**: total number of FMR files, set to 0 initially
* **o.mCorrTarget**: name of target FMR for motion correction, set to `""` initially
* **o.homeDir**: name of base session directory, set to `""` initially
* **o.BVdir**: name of BV subdirectory, set to `""` initially
* **o.fmrList**: list of FMR files (created before COPE & preprocessing), set to `[]` initially
* **o.taskIDs**: list of task identifier strings (e.g. MTLocal, Attention), read from volume reference file; set to `[]` initially
* **o.taskVols**: list of expected number of volumes per task, set to `[]` initially
* **o.fmrListString**: string of FMR filenames separated by newline, set to `""` initially
* **o.vdmFile**: name of VDM file generated by COPE, set to `""` initially
* **o.iaFile**: name of IA transformation file, set to `""` initially
* **o.faFile**: name of FA transformation file, set to `""` initially
* **o.preprocComplete**: binary flag indicating whether basic preprocessing (FMR, Motion correction, HPF, VMR) is currently complete, set to 0 initially
* **o.sessionListFile**: eventual location of session list file for VTC creation, set to `""` initially

#### Externally set values
* **o.volRefFileName**: path to and name of file which contains list of task identifiers and volumes, comma-separated, one per line, e.g. `/home/tarrlab/Documents/STS-R21-Volume-Reference.txt`
* **o.vdmEstimate**: array of filename identifiers for VDM estimation, first should be set as opposite phase run identifier, e.g. `["*OppPhase*PA*.fmr", ""]` , and second left blank to be filled in by script
* **o.mCorrTargetFileName**: name of text file where motion corr target filename will be written, e.g. `motion_correction_target_file.txt`

#### COPE parameters
* **o.vol0spinBox**: volume for first VDM estimation target, set to 0
* **o.vol1spinBox**: volume for second VDM estimation target, set to 0
* **o.rllr**: phase encoding direction (rl-lr or ap-pa), set to 0 
* **o.use_ic**: type of data (if 0, gradient echo), set to 0
* **o.use_ssd**: distance measure for local opt (if 0, normalized cross-corr (NCC)), set to 0
* **o.apply_to_input**: apply VDM to input files used to estimate it, set to 0
* **o.save_derivative**: save derivative, set to 0
* **o.fast_algorithm**: use fast algorithm (only for testing), set to 0

***
