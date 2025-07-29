#!/bin/zsh

echo PATH=$PATH:$(npm config get prefix)/bin >> ~/.zshrc
source ~/.zshrc

yarn
