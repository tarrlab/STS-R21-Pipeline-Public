% helper script for batch PRT

function [condNames, taskName] = getPRTparams(fname)

    load STSR21TaskVolumeLookup.mat

    % create maps for task identifier to condition list, long form names
    taskIDs = {STSR21TaskVolumeLookup{:,1}};
    taskCondNames = { ...
        {'A_only','V_only','AV','fixation'}, ... %AV
        {'biological','scrambled','fixation'}, ... %bio
        {'NULL'}, ... %bowtie
        {'adults','children','bodies','limbs','cars','instruments', 'houses', 'corridors', 'scrambled', 'fixation'}, ... %combo
        {'static face','static scrambled','dynamic face','dynamic scrambled','fixation'}, ... %dynamic faces
        {'static', 'motion','fixation'}, ... %MT
        {'social', 'mechanical','fixation'}, ... %social
        {'speech','scn','fixation'}, ... %speech
        {'belief','photo','fixation'}, ... %ToM
    };

    taskNames = { ...
        'AV Localizer', ... %AV
        'Bio Motion Localizer', ... %bio
        'Bowtie Retinotopy', ... %bowtie
        'Combo Localizer', ... %combo
        'Dynamic Faces', ... %dynamic faces
        'Optic Flow MT Localizer', ... %MT
        'Social Localizer', ... %social
        'Speech Localizer', ... %speech
        'ToM Localizer', ... %ToM
    };

    condLookup = containers.Map(taskIDs, taskCondNames);
    nameLookup = containers.Map(taskIDs, taskNames);

    condNames = {};
    taskName = '';
    
    for t = 1:length(STSR21TaskVolumeLookup)
        if contains(fname, STSR21TaskVolumeLookup{t,1})
            curID = STSR21TaskVolumeLookup{t,1};
            condNames = condLookup(curID);
            taskName = nameLookup(curID);
        end
    end
end