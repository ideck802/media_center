#!/bin/sh

sudo mount -t cifs -o username=talking_human,password=Ipd802@@,uid=1000,gid=1000,mfsymlinks //192.168.1.2/media/ /home/talking_human/media/
