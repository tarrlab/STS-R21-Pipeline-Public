#!/bin/bash

ext_path=$1

echo -n "INSTALLING PLUGINS......"
mv Plugins/* $1"/Plugins_64"
echo "DONE."
echo -n "INSTALLING SCRIPTS......"
mv Scripts/* $1"/Scripts"
echo "DONE."
echo "ADDING REPOSITORY TO MATLAB PATH:"
sudo matlab -nodesktop -r "addpath(genpath("\'$(pwd)\'"));savepath;exit()"
echo "DONE."
