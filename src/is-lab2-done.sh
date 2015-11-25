#!/bin/bash

expected="$(cat helloworld.bf)"
actual="$(./brainfuck helloworld.bf)"

if [ "$expected" == "$actual" ]; then
    echo "Hooray, you're done, probably!"
else
    echo "Whoops, you're not done yet."
fi
