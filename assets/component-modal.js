if (typeof ModalBox !== "function") {
  class ModalBox extends HTMLElement {

    constructor() {
      window.inertElems = document.querySelectorAll("[data-js-inert]");

      super();
      this.o = {
        ...{
          show: 10,
          showOnPageOffset: -1,
          frequency: "day",
          enabled: true,
          showOnce: true,
          closeByKey: true,
          disableScroll: true,
          enableClose: false,
          type: false,
          blockTabNavigation: false,
          openedModalBodyClass: "modal-opened",
        },
        ...JSON.parse(this.dataset.options),
      };

			if ( this.o.type == "cookies" ) {
				
				this.o.enabled = false;

				const showBanner = () => {
					this.o.enabled = true;
					this.show();
				}
			
				const cookiesAccept = () => {
					window.Shopify.customerPrivacy.setTrackingConsent({
						"analytics": true,
						"marketing": true,
						"preferences": true
					}, () => {});
					localStorage.setItem('krown-cookie-banner', 'true'); 
				}
				const cookiesDecline = () => {
					window.Shopify.customerPrivacy.setTrackingConsent({
						"analytics": false,
						"marketing": false,
						"preferences": false
					}, () => {});
					localStorage.setItem('krown-cookie-banner', 'true'); 
				}
			
				const initCookieBanner = () => {
					if ( localStorage.getItem('krown-cookie-banner') !== 'true' ) {
						showBanner();
					}
				}

				this.querySelector('[data-js-cookies-accept]').addEventListener('click', cookiesAccept);
				this.querySelector('[data-js-cookies-decline]').addEventListener('click', cookiesDecline);

				window.Shopify.loadFeatures(
					[
						{
							name: 'consent-tracking-api',
							version: '0.1',
						},
					],
					error => {
						if (error) {
							throw error;
						}
						initCookieBanner();
					}
				);
			}

      this._scrollTriggered = false; // To track if scroll condition has been met

      if ( this.o.enabled ) {
        this._modalKey = `modal-${document.location.hostname}-${this.id}`;
        this._modalStorage = !localStorage.getItem(this._modalKey)
          ? "empty"
          : JSON.parse(localStorage.getItem(this._modalKey));
        if (this.querySelector("[data-content]")) {
          this._modalText = this.querySelector("[data-content]").textContent;
        }

        const timeNow = new Date().getTime();
        const inBetween = Math.round(
          (timeNow - this._modalStorage["shown"]) / 1000
        );

        let showModal = false;

        if (
          this._modalStorage == "empty" ||
          (this.o.frequency == "day" && inBetween > 86400) ||
          (this.o.frequency == "week" && inBetween > 604800) ||
          (this.o.frequency == "month" && inBetween > 2419200) ||
          this._modalStorage["content"] != this._modalText
        ) {
          showModal = true;
        }

        if ( showModal ) {

          if ( this.o.type == "exit_intent_popup" ) {

            let lastMouseY = 0; 
            let topOffset = 20; 
    
            document.addEventListener('mousemove', e => {
              const currentMouseY = e.clientY;
              if (currentMouseY < lastMouseY && currentMouseY < topOffset && ! Shopify.designMode) { 
                this.show();
              }
              lastMouseY = currentMouseY;
            });

          } else if ( this.o.showOnPageOffset > 0 ) {
            this._onScroll = () => {
              const scrollPercent =
                (window.scrollY /
                  (document.documentElement.scrollHeight -
                    window.innerHeight)) *
                100;
              if (
                scrollPercent >= this.o.showOnPageOffset &&
                !this._scrollTriggered
              ) {
                this._scrollTriggered = true;
                setTimeout(() => {
                  this.show();
                }, parseInt(this.o.show * 1000));
                window.removeEventListener("scroll", this._onScroll);
              }
            };
            window.addEventListener("scroll", this._onScroll, {
              passive: true,
            });

          } else {
            setTimeout(() => {
              this.show();
            }, parseInt(this.o.show * 1000));
          }

        }
        this.querySelectorAll("[data-js-close]").forEach((elm) =>
          elm.addEventListener("click", () => {
            this.hide(this.o.showOnce);
          })
        );
      } else {
        this.querySelectorAll("[data-js-close]").forEach((elm) =>
          elm.addEventListener("click", () => {
            this.hide(this.o.showOnce);
          })
        );
      }

      if (this.o.enableClose == true) {
        this.querySelectorAll("[data-js-close]").forEach((elm) =>
          elm.addEventListener("click", () => {
            this.hide(this.o.showOnce);
          })
        );
      }

      if (this.o.closeByKey) {
        document.addEventListener("keydown", (e) => {
          if (e.keyCode == 27) {
            if (this.classList.contains("active")) {
              this.hide(this.o.showOnce);
            }
          }
        });
      }
    }

    show(customContent = false) {
      if (customContent && document.querySelector(customContent)) {
        const content = document.querySelector(customContent).innerHTML;
        const modalCommon = document.getElementById("modal-common");
        modalCommon.innerHTML = content;
        if (this.o.enableClose == true) {
          modalCommon.querySelectorAll("[data-js-close]").forEach((elm) =>
            elm.addEventListener("click", () => {
              this.hide(this.o.showOnce);
            })
          );
        }
      }

      this.setAttribute("style", "");
      setTimeout(() => {
        this.classList.add("active");
        if (this.o.disableScroll) {
          document.body.classList.add(this.o.openedModalBodyClass);
        }
        if (this.o.blockTabNavigation) {
          window.inertElems.forEach((elm) => {
            elm.setAttribute("inert", "");
          });
        }
      }, 10);
      setTimeout(() => {
        if (this.querySelector("[data-js-first-focus]")) {
          this.querySelector("[data-js-first-focus]").focus();
        }
      }, 250);
    }

    hide(remember = false) {
      this.classList.remove("active");
      document.body.classList.remove(this.o.openedModalBodyClass);
      setTimeout(() => {
        this.style.display = "none";
      }, 500);
      if (remember && !Shopify.designMode) {
        localStorage.setItem(
          this._modalKey,
          JSON.stringify({
            shown: new Date().getTime(),
            content: this._modalText,
          })
        );
      }
      window.inertElems.forEach((elm) => {
        elm.removeAttribute("inert");
      });
      if (window.lastFocusedElm) {
        setTimeout(() => {
          window.lastFocusedElm.focus();
          window.lastFocusedElm = null;
        }, 100);
      }
    }
  }

  if (typeof customElements.get("modal-box") == "undefined") {
    // Clone modal elements and move to end of body IF append-top-body

    const originalElements = document.querySelectorAll("modal-box");

    originalElements.forEach((originalElement) => {
      const dataOptions = JSON.parse(originalElement.dataset.options);
      if (dataOptions.appendToBody === true) {
        document.body.appendChild(originalElement);
      }
    });

    customElements.define("modal-box", ModalBox);
  }

  // Shopify events

  document.addEventListener("shopify:section:select", (e) => {
    if (e.target.classList.contains("mount-popup")) {
      e.target.querySelector("modal-box").style.display = "block";
      e.target.querySelector("modal-box").show();
    }
  });
  document.addEventListener("shopify:block:select", (e) => {
    if (e.target.hasAttribute("data-modal-box")) {
      e.target.style.display = "block";
      e.target.show();
    }
  });
  document.addEventListener("shopify:block:deselect", (e) => {
    if (e.target.hasAttribute("data-modal-box")) {
      e.target.hide();
    }
  });
  document.addEventListener("shopify:section:deselect", (e) => {
    if (e.target.classList.contains("mount-popup")) {
      e.target.querySelector("modal-box").hide();
    }
  });
	
}