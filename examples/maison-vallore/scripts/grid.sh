#!/usr/bin/env bash
# grid.sh out.png f1.png ... f8.png  → 4x2 contact sheet
set -e
out=$1; shift
in=(); for f in "$@"; do in+=(-i "$f"); done
n=$#
layout=""; for ((i=0;i<n;i++)); do c=$((i%4)); r=$((i/4)); x=$([ $c -eq 0 ] && echo 0 || echo "$(for ((k=0;k<c;k++)); do printf 'w0+'; done | sed 's/+$//')"); y=$([ $r -eq 0 ] && echo 0 || echo h0); layout+="${x}_${y}|"; done
ffmpeg -y -loglevel error "${in[@]}" -filter_complex "xstack=inputs=$n:layout=${layout%|}:fill=gray" "$out"
