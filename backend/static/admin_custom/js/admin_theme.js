/*
 * Custom JavaScript for Django Admin Panel
 * Adds micro-interactions to make the UI feel alive.
 */

document.addEventListener("DOMContentLoaded", () => {
    // Add ripple effect to all primary buttons
    const buttons = document.querySelectorAll('.button, input[type=submit], input[type=button]');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', function (e) {
            let x = e.clientX - e.target.getBoundingClientRect().left;
            let y = e.clientY - e.target.getBoundingClientRect().top;
            
            let ripples = document.createElement('span');
            ripples.style.left = x + 'px';
            ripples.style.top = y + 'px';
            ripples.classList.add('ripple');
            
            this.appendChild(ripples);
            
            setTimeout(() => {
                ripples.remove();
            }, 1000);
        });
    });

    // Add dynamic CSS for ripples
    const style = document.createElement('style');
    style.innerHTML = `
        .button, input[type=submit], input[type=button] {
            position: relative;
            overflow: hidden;
        }
        .ripple {
            position: absolute;
            background: rgba(255, 255, 255, 0.4);
            transform: translate(-50%, -50%);
            pointer-events: none;
            border-radius: 50%;
            animation: animateRipple 0.6s linear;
        }
        @keyframes animateRipple {
            0% {
                width: 0px;
                height: 0px;
                opacity: 0.5;
            }
            100% {
                width: 500px;
                height: 500px;
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
});
