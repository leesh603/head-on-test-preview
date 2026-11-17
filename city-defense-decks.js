export const PARIS_DECK_FRAMES={
 'light-nw':[0,0,231,252],'light-ne':[256,0,231,252],
 'light-sw':[512,0,231,234],'light-se':[0,256,231,234],'light-main':[256,256,221,228],
 'aa-left':[512,256,145,165],'aa-right':[0,512,145,165],
 // The lower sockets use the matching clean gun platforms, turned with their stairs.
 'mg-left':[512,256,145,165],'mg-right':[0,512,145,165]
};
// Source rectangles are registered independently of their replacement clips.
export const PARIS_DECK_PLACEMENT={
 'aa-left':[-553,-296,118,134],'aa-right':[435,-296,118,134],
 'mg-left':[-570,62,118,134],'mg-right':[443,61,118,134]
};
// Atlas pixels for the lens axis and the two gun traversing bearings.
export const PARIS_MOUNTS={
 light:{y:18,height:286,pivotX:124,pivotY:121,span:2},
 aa:{y:320,height:338,pivotX:126,pivotY:242,span:2.5,boreY:6},
 mg:{y:674,height:326,pivotX:130,pivotY:205,span:3,boreY:1}
};
