% Create SDM from all PRT files in a directory

% load volume reference
load STSR21TaskVolumeLookup.mat

% choose directory
basedir = uigetdir;
contents = dir(basedir);
cd basedir
prtFiles = dir('*.prt');

% loop over prts, create sdms
for i = 1:length(prtFiles)
    prt = xff(prtFiles(i).name);
    [pt, fname, ext] = fileparts(fullfile(basedir, prtFiles(i).name));
    params.rcond = length(prt.Cond);
    params.prtr = 2000;
    params.nvol = 0;
    for tname = 1:length(STSR21TaskVolumeLookup)
        if contains(fname, STSR21TaskVolumeLookup{tname,1})
            params.nvol = STSR21TaskVolumeLookup{tname,2};
        end
    end
    sdm = prt.CreateSDM(params);
    sdm.SaveAs([fname '.sdm']);
end
