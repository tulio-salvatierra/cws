import "./InfiniteScroll.css";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

interface AnimationState {
    incr: number;
    deltaObject: { delta: number };
    deltaTo: ReturnType<typeof gsap.quickTo> | null;
    tl: ReturnType<typeof gsap.timeline> | null;
    isWheeling: number | null;
    indexImg: number;
    mediaArray: string[];
}

export default function Infinite3DScroll() {
    const containerRef = useRef<HTMLElement | null>(null);
    const animStateRef = useRef<AnimationState>({
        incr: 400, // Start at 400 to begin animation partway through
        deltaObject: { delta: 0 },
        deltaTo: null,
        tl: null,
        isWheeling: null,
        indexImg: 0,
        mediaArray: []
    });

    useGSAP(() => {
        const root = containerRef.current;
        if (!root) return;

        const container = root.querySelector('.container');
        if (!container) return;

        // Only add no-smooth class if needed, but don't prevent body scrolling

        const mediaArray: string[] = [];
        root.querySelectorAll('.preload-medias img').forEach((image: Element) => {
            const src = image.getAttribute('src');
            if (src) mediaArray.push(src);
        });
        animStateRef.current.mediaArray = mediaArray;

        const medias = root.querySelectorAll('.media');
        const mediasImg = root.querySelectorAll('.media img');

        if (medias.length === 0 || mediaArray.length === 0) return;

        // Define updateMedia function before using it
        function updateMedia(media: HTMLElement): void {
            if (!animStateRef.current || !animStateRef.current.mediaArray || animStateRef.current.mediaArray.length === 0) {
                return;
            }

            gsap.set(media, {
                xPercent: -50,
                yPercent: -50,
                // Random value between 0.2 and 0.8 to keep elements within the frame 
                x: (Math.random() * (0.8 - 0.2) + 0.2) * window.innerWidth,
                y: (Math.random() * (0.8 - 0.2) + 0.2) * window.innerHeight,
            });

            // Assigning a new media URL
            const currentIndex = animStateRef.current.indexImg || 0;
            animStateRef.current.indexImg = (currentIndex + 1) % animStateRef.current.mediaArray.length;
            const img = media.querySelector('img');
            if (img && animStateRef.current.mediaArray[animStateRef.current.indexImg]) {
                img.setAttribute('src', animStateRef.current.mediaArray[animStateRef.current.indexImg]);
            }
        }

        // QUICK TOS
        const deltaTo = gsap.quickTo(animStateRef.current.deltaObject, 'delta', { duration: 2, ease: "power1" });
        animStateRef.current.deltaTo = deltaTo;
        const rotY = gsap.quickTo(container, "rotationY", { duration: 0.5, ease: 'power1' });
        const rotX = gsap.quickTo(container, "rotationX", { duration: 0.5, ease: 'power1' });

        medias.forEach((media: Element) => {
            updateMedia(media as HTMLElement);
        });

        const tl = gsap.timeline({
            paused: true // Keep paused, controlled by tick function
        });
        animStateRef.current.tl = tl;

        tl.to(medias, {
            z: 0, // Bring back to front
            ease: "none", // Linear movement
            duration: 8, // Same as number of images
            stagger: {
                each: 1, // Each image starts evenly spaced across the total duration
                repeat: -1, // Infinite repeat
                onRepeat(this: gsap.core.Tween) {
                    // Calling the function with the repeated item as a parameter accessible via this.targets()[0]
                    updateMedia(this.targets()[0] as HTMLElement);
                }
            }
        });
        tl.fromTo(mediasImg, {
            scale: 0
        }, {
            scale: 1, // Making the image appear at the back
            ease: "back.out(2)", // With a slight bounce effect
            duration: 0.6,
            stagger: {
                each: 1, // Each image starts evenly spaced across the total duration
                repeat: -1,
                repeatDelay: 7.4, // 7.4 + 0.6 = 8
                onRepeat(this: gsap.core.Tween) {
                    // When it repeats: force the scale to 0
                    (this.targets()[0] as HTMLElement).style.transform = "scale(0, 0)";
                }
            }
        }, '<'); // Means the animation starts at the beginning of the previous tween
        tl.fromTo(mediasImg, {
            scale: 1,
        }, {
            scale: 0, // Making the image disappear at the back
            ease: "back.in(1.2)", // With a slight bounce effect
            duration: 0.6,
            immediateRender: false, // Because the same property is animated by another tween
            delay: 7.4, // Since 7.4 + 0.6 = 8, it will play exactly at the end
            stagger: {
                each: 1, // Each image starts evenly spaced across the total duration
                repeat: -1,
                repeatDelay: 7.4, // 7.4 + 0.6 = 8
                onRepeat(this: gsap.core.Tween) {
                    // When it repeats: force the scale to 1
                    (this.targets()[0] as HTMLElement).style.transform = "scale(1, 1)";
                }
            }
        }, '<'); // Means the animation starts at the beginning of the previous tween

        function handleWheel(e: WheelEvent): void {
            if (!root) return;
            const rect = root.getBoundingClientRect();
            const scrollDelta = e.deltaY;

            // Calculate how much of the component is visible
            const visibleTop = Math.max(0, rect.top);
            const visibleBottom = Math.min(window.innerHeight, rect.bottom);
            const visibleHeight = visibleBottom - visibleTop;
            const componentHeight = rect.height;
            const visibilityRatio = visibleHeight / componentHeight;

            // Only capture scroll if more than 50% of component is visible
            // This allows normal scrolling when component is leaving viewport
            if (visibilityRatio > 0.5 && animStateRef.current.deltaTo) {
                e.preventDefault(); // Prevent page scroll when interacting with component
                animStateRef.current.deltaTo(scrollDelta);
            }
            // If less than 50% visible, allow normal page scrolling (don't prevent default)

            if (animStateRef.current.isWheeling !== null) {
                window.clearTimeout(animStateRef.current.isWheeling); // Kill setTimeout
            }
            animStateRef.current.isWheeling = setTimeout(() => { // Init setTimeout
                if (animStateRef.current.deltaTo) {
                    animStateRef.current.deltaTo(0); // Reset speed
                }
            }, 120);
        }

        function tick(time: number, dt: number): void {
            // deltaObject.delta varies depending on deltaTo()
            animStateRef.current.incr += animStateRef.current.deltaObject.delta / 300 + dt / 1000;
            if (animStateRef.current.tl) {
                animStateRef.current.tl.time(animStateRef.current.incr); // time() : go to a specific time of a timeline
            }
        }

        gsap.ticker.add(tick);
        root.addEventListener("wheel", handleWheel, { passive: false }); // Attach to component root, not window
        root.addEventListener("mousemove", (e: MouseEvent) => {
            const valY = (e.clientX / window.innerWidth - 0.5) * 10;
            const valX = (e.clientY / window.innerHeight - 0.5) * 10;

            rotY(valY);
            rotX(-valX);
        });

        // Cleanup function
        return () => {
            gsap.ticker.remove(tick);
            root.removeEventListener("wheel", handleWheel);
            if (animStateRef.current.isWheeling) {
                clearTimeout(animStateRef.current.isWheeling);
            }
            if (animStateRef.current.tl) {
                animStateRef.current.tl.kill();
            }
        };
    }, { scope: containerRef });

    return (
        <>
            <section ref={containerRef} className="mwg_effect012">
          
                <div className="container">
                    <div className="media"><img src="/images/Bulb.png" alt="" /></div>
                    <div className="media"><img src="/images/Rocket.png" alt="" /></div>
                    <div className="media"><img src="/images/Mailbox.png" alt="" /></div>
                    <div className="media"><img src="/images/Speaker.png" alt="" /></div>
                    <div className="media"><img src="/images/Lightbulb.png" alt="" /></div>
                    <div className="media"><img src="/images/Bulb.png" alt="" /></div>
                    <div className="media"><img src="/images/Bulb.png" alt="" /></div>

                    <div className="preload-medias">
                        <img src="/images/Bulb.png" alt="" />
                        <img src="/images/Rocket.png" alt="" />
                        <img src="/images/Mailbox.png" alt="" />
                        <img src="/images/Speaker.png" alt="" />

                    </div>
                </div>
            </section>
        </>
    )
}