import { reviewsData } from './reviewsData';
import './Reviews.css';
import { useEffect } from 'react';
import gsap from 'gsap';
import { useFadeIn } from '../../Hooks/useFadeIn';

export default function Reviews() {
  const fadeInRef = useFadeIn();
  const fadeInRef2 = useFadeIn();
  useEffect(() => {
    const container = document.querySelector('.mwg_effect025 .container');
    if (!container) return;

    const containerW = container.clientWidth;

    const cards = document.querySelectorAll('.card');
    const cardsLength = cards.length;

    const cardContent = document.querySelectorAll('.card .content')

    let currentPortion = 0 // No portion hovered at the start
    const isMobile = window.innerWidth <= 768;

    // On mobile, center all cards initially
    if (isMobile) {
        cards.forEach((card, index) => {
            gsap.set(card, {
                xPercent: 0,
                yPercent: 0,
                rotation: 0,
            })
        })
    } else {
        cards.forEach(card => {
            gsap.set(card, {
                xPercent: (Math.random() - 0.5) * 10,
                yPercent: (Math.random() - 0.5) * 10,
                rotation: (Math.random() - 0.5) * 20,
            })
        })
    }

    function resetPortion(index: number) {
        // Last active card
        gsap.to(cards[index], {
            xPercent: (Math.random() - 0.5) * 10,
            yPercent: (Math.random() - 0.5) * 10,
            rotation: (Math.random() - 0.5) * 20,
            scale:1,
            duration:0.8,
            ease:'elastic.out(1, 0.75)',
        })
    }

    function newPortion(i: number) {
        gsap.to(cards[i], {
            // Reset transformation attributes
            xPercent:0,
            yPercent:0,
            rotation:0,
            duration:0.8,
            scale:1.1,
            ease:'elastic.out(1, 0.75)' // Elastic movement at the end (out)
        })

        // For each card's child element
        cardContent.forEach((content, index) => {
            // If it's not the active card
            if(index !== i){
                gsap.to(content, {
                    // When index - i < 0, push left
                    // When index - i > 0, push right
                    // The further (index - i) moves from 0 in both ways, the smaller the displacement
                    xPercent: 80 / (index - i),
                    ease:'elastic.out(1, 0.75)',
                    duration:0.8
                })
            // If it is the active card
            }else{
                // Center its child
                gsap.to(content, {
                    xPercent: 0,
                    ease:'elastic.out(1, 0.75)',
                    duration:0.8
                })
            }
        })
    }

    const handleMouseMove = (e: Event) => {
        if (isMobile) return; // Disable mouse move effects on mobile
        const mouseEvent = e as MouseEvent;
        // Cursor position relative to the left edge of the container
        const mouseX = mouseEvent.clientX - container.getBoundingClientRect().left
        // Cursor's horizontal percentage within the container
        const percentage = mouseX / containerW
        // Round the value up to get a valid index
        const activePortion = Math.ceil(percentage * cardsLength)
        
        // If a new portion is hovered
        if(
            currentPortion !== activePortion &&
            activePortion > 0 &&
            activePortion <= cardsLength
        ){
            // If a portion was already hovered, reset it
            // -1 to target the correct index in the card set
            if(currentPortion !== 0){ resetPortion(currentPortion - 1) }

            // Update the index of the new portion
            currentPortion = activePortion
            // -1 to target the correct index in the card set
            newPortion(currentPortion - 1)
        }
    };

    const handleMouseLeave = () => {
        if (isMobile) return; // Disable mouse leave effects on mobile
        // -1 to target the correct index in the card set
        resetPortion(currentPortion - 1)
        // No portion is hovered anymore
        currentPortion = 0
    };

    // Mobile touch handler - center the clicked card
    const clickHandlers: Array<(e: Event) => void> = [];
    
    if (!isMobile) {
        container.addEventListener("mousemove", handleMouseMove);
        container.addEventListener("mouseleave", handleMouseLeave);
    } else {
        // Add click handlers to cards on mobile
        cards.forEach((card, index) => {
            const handleCardClick = () => {
                // Reset all cards to center
                cards.forEach((c, i) => {
                    gsap.to(c, {
                        xPercent: 0,
                        yPercent: 0,
                        rotation: 0,
                        scale: i === index ? 1.05 : 1,
                        duration: 0.5,
                        ease: 'power2.out'
                    })
                })
                
                // Center all card content
                cardContent.forEach((content) => {
                    gsap.to(content, {
                        xPercent: 0,
                        duration: 0.5,
                        ease: 'power2.out'
                    })
                })
            };
            clickHandlers.push(handleCardClick);
            card.addEventListener('click', handleCardClick);
        });
    }

    // Recenter all direct child elements of the cards
    gsap.to(cardContent, {
        xPercent: 0,
        ease:'elastic.out(1, 0.75)',
        duration:0.8
    });

    // Cleanup
    return () => {
        if (!isMobile) {
            container.removeEventListener("mousemove", handleMouseMove);
            container.removeEventListener("mouseleave", handleMouseLeave);
        } else {
            cards.forEach((card, index) => {
                if (clickHandlers[index]) {
                    card.removeEventListener('click', clickHandlers[index]);
                }
            });
        }
    };
  }, []);

  return (
    <section className="mwg_effect025 my-20 flex flex-col items-center justify-center h-screen">   
      <h3 ref={fadeInRef} className="text-center mb-20 text-4xl md:text-6xl font-main font-bold text-orange-500">What Our Clients Say</h3>
      <div ref={fadeInRef2} className="container">
        {reviewsData.map((review) => (
          <div key={review.id} className="card">
            <div className="content">
              <p className="top">"{review.quote}"</p>
              <div className="bottom">

                <div>
                  <p>{review.author}</p>
                  <p className="job font-main font-bold text-orange-500">{review.role}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
