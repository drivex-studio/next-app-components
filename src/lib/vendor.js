import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { cx as classVarianceCx } from "class-variance-authority";

gsap.registerPlugin(
    ScrollTrigger, 
    ScrambleTextPlugin, 
    SplitText, 
    useGSAP, 
    Flip
 );

export { 
    gsap, 
    ScrollTrigger, 
    SplitText, 
    ScrambleTextPlugin, 
    Flip, 
    useGSAP 
 };

export const cx = classVarianceCx;
export { cva } from "class-variance-authority";
