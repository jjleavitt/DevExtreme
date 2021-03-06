import React from 'react';
import each from 'jest-each';
import { mount } from 'enzyme';
import { isNumeric } from '../../../../core/utils/type';

import {
  clear as clearEventHandlers, emit, getEventHandlers, defaultEvent,
} from '../../../test_utils/events_mock';

import {
  Scrollbar,
  viewFunction,
} from '../scrollbar';

import { DisposeEffectReturn } from '../../../utils/effect_return.d';
import { DIRECTION_HORIZONTAL } from '../scrollable_utils';
import { ScrollbarProps } from '../scrollbar_props';

describe('TopPocket', () => {
  describe('Styles', () => {
    each(['horizontal', 'vertical']).describe('Direction: %o', (direction) => {
      each(['never', 'always', 'onScroll', 'onHover', null, undefined]).describe('ShowScrollbar: %o', (showScrollbar) => {
        each([100, 200]).describe('ContainerSize: %o', (containerSize) => {
          each([100, 200]).describe('ContentSize: %o', (contentSize) => {
            it('Should assign styles', () => {
              const scrollbar = new Scrollbar({
                showScrollbar,
                direction,
                containerSize,
                contentSize,
                scaleRatio: 1,
              });

              const { styles } = scrollbar as any;

              const expectedSize = contentSize
                ? containerSize * (containerSize / contentSize)
                : containerSize * containerSize;
              expect(styles).toHaveProperty(direction === 'vertical' ? 'height' : 'width', expectedSize);
              expect(styles).toHaveProperty(direction === 'vertical' ? 'width' : 'height', undefined);
            });
          });
        });
      });
    });
  });

  describe('Classes', () => {
    each(['horizontal', 'vertical']).describe('Direction: %o', (direction) => {
      each(['never', 'always', 'onScroll', 'onHover', null, undefined]).describe('ShowScrollbar: %o', (showScrollbar) => {
        each([true, false]).describe('ScrollByThumb: %o', (scrollByThumb) => {
          it('should add scroll hoverable class', () => {
            const viewModel = new Scrollbar({ direction, scrollByThumb, showScrollbar });

            const needHoverableClass = (showScrollbar === 'onHover' || showScrollbar === 'always') && scrollByThumb;

            const scrollbar = mount(viewFunction(viewModel) as JSX.Element);

            if (needHoverableClass) {
              expect(viewModel.cssClasses).toEqual(expect.stringMatching('dx-scrollbar-hoverable'));
              expect(scrollbar.find('.dx-scrollbar-hoverable').length).toBe(1);
            } else {
              expect(viewModel.cssClasses).toEqual(expect.not.stringMatching('dx-scrollbar-hoverable'));
              expect(scrollbar.find('.dx-scrollbar-hoverable').length).toBe(0);
            }
          });
        });

        each([0, 100, 500]).describe('BaseContainerSize: %o', (baseContainerSize) => {
          each([0, 100, 500]).describe('BaseContentSize: %o', (baseContentSize) => {
            each([true, false]).describe('Visible: %o', (visible) => {
              it('scrollbar visibility', () => {
                const viewModel = new Scrollbar({
                  direction, visible, showScrollbar, baseContainerSize, baseContentSize,
                });

                const baseRatio = (baseContentSize
                  ? baseContainerSize / baseContentSize
                  : baseContainerSize
                );

                const scrollbarShouldHaveInvisibleClass = showScrollbar === 'never' || baseRatio >= 1;
                const scrollShouldHaveInvisibleClass = !visible || baseRatio >= 1;

                const scrollbar = mount(viewFunction(viewModel) as JSX.Element);

                expect(scrollbar.getDOMNode().className).toEqual(scrollbarShouldHaveInvisibleClass
                  ? expect.stringMatching('dx-state-invisible')
                  : expect.not.stringMatching('dx-state-invisible'));

                expect(scrollbar.find('.dx-scrollable-scroll').getDOMNode().className).toEqual(scrollShouldHaveInvisibleClass
                  ? expect.stringMatching('dx-state-invisible')
                  : expect.not.stringMatching('dx-state-invisible'));
              });
            });
          });
        });
      });
    });
  });

  describe('Effects', () => {
    beforeEach(clearEventHandlers);

    it('should subscribe to pointerDown event', () => {
      const scrollbar = new Scrollbar({ direction: 'vertical' });
      const feedbackOn = jest.fn();
      (scrollbar as any).feedbackOn = feedbackOn;

      scrollbar.pointerDownEffect();
      emit('dxpointerdown');

      expect(feedbackOn).toHaveBeenCalledTimes(1);
    });

    it('pointerDownEffect should return unsubscribe callback', () => {
      const scrollbar = new Scrollbar({ direction: 'vertical' });

      const detach = scrollbar.pointerDownEffect() as DisposeEffectReturn;

      expect(getEventHandlers('dxpointerdown').length).toBe(1);
      detach();
      expect(getEventHandlers('dxpointerdown').length).toBe(0);
    });

    it('Down & Up effects should add & remove scroll active class', () => {
      const scrollbar = new Scrollbar({ direction: 'vertical' });

      scrollbar.pointerDownEffect();
      emit('dxpointerdown');

      expect(scrollbar.active).toEqual(true);
      expect(scrollbar.cssClasses).toEqual(expect.stringMatching('dx-scrollable-scrollbar-active'));

      scrollbar.pointerUpEffect();
      emit('dxpointerup');

      expect(scrollbar.active).toEqual(false);
      expect(scrollbar.cssClasses).toEqual(expect.not.stringMatching('dx-scrollable-scrollbar-active'));
    });

    it('should subscribe to pointerUp event', () => {
      const scrollbar = new Scrollbar({ direction: 'vertical' });
      const feedbackOff = jest.fn();
      (scrollbar as any).feedbackOff = feedbackOff;

      scrollbar.pointerUpEffect();
      emit('dxpointerup');

      expect(feedbackOff).toHaveBeenCalledTimes(1);
    });

    it('pointerUpEffect should return unsubscribe callback', () => {
      const scrollbar = new Scrollbar({ direction: 'vertical' });

      const detach = scrollbar.pointerUpEffect() as DisposeEffectReturn;

      expect(getEventHandlers('dxpointerup').length).toBe(1);
      detach();
      expect(getEventHandlers('dxpointerup').length).toBe(0);
    });
  });
});

describe('Methods', () => {
  each(['horizontal', 'vertical']).describe('Direction: %o', (direction) => {
    each(['never', 'always', 'onScroll', 'onHover']).describe('ShowScrollbar: %o', (showScrollbar) => {
      each([{ top: -100, left: -100 }, { top: -100 }, { left: -100 }, -100]).describe('Location: %o', (location) => {
        it('moveTo()', () => {
          const scrollRef = React.createRef();
          const viewModel = new Scrollbar({
            showScrollbar,
            direction,
            scaleRatio: 1,
            containerSize: 100,
            contentSize: 500,
          });
          (viewModel as any).scrollRef = scrollRef;

          mount(viewFunction(viewModel as any) as JSX.Element);
          (viewModel as any).scrollRef = (viewModel as any).scrollRef.current;

          viewModel.moveTo(location);

          const scrollbarStyle = window.getComputedStyle((viewModel as any).scrollRef);
          if (showScrollbar === 'never') {
            expect(scrollbarStyle.transform).toEqual('');
            return;
          }

          let expectedValue = 0;
          const expectedThumbRatio = 0.2;
          if (isNumeric(location)) {
            expectedValue = -location * expectedThumbRatio;
          } else {
            expectedValue = -(location[direction === DIRECTION_HORIZONTAL ? 'left' : 'top'] || 0) * expectedThumbRatio;
          }

          expect(scrollbarStyle).toHaveProperty('transform', direction === DIRECTION_HORIZONTAL ? `translate(${expectedValue}px, 0px)` : `translate(0px, ${expectedValue}px)`);
        });
      });

      it('isScrollbar(element), element is scrollbar element', () => {
        const viewModel = new Scrollbar({
          showScrollbar, direction,
        } as ScrollbarProps) as any;

        const scrollbar = mount(viewFunction(viewModel as any) as JSX.Element);
        viewModel.scrollbarRef = scrollbar.getDOMNode();

        expect(viewModel.isScrollbar(scrollbar.getDOMNode())).toBe(true);
      });

      it('isScrollbar(element), element is not scrollbar element', () => {
        const viewModel = new Scrollbar({
          showScrollbar, direction,
        } as ScrollbarProps) as any;

        const scrollbar = mount(viewFunction(viewModel as any) as JSX.Element);
        viewModel.scrollbarRef = scrollbar.getDOMNode();

        expect(viewModel.isScrollbar(scrollbar.find('.dx-scrollable-scroll').getDOMNode())).toBe(false);
      });

      it('isThumb(element), element is scrollable scroll element', () => {
        const viewModel = new Scrollbar({
          showScrollbar, direction,
        } as ScrollbarProps) as any;

        const scrollbar = mount(viewFunction(viewModel) as JSX.Element);
        viewModel.scrollbarRef = scrollbar.getDOMNode();

        expect(viewModel.isThumb(scrollbar.find('.dx-scrollable-scroll').getDOMNode())).toBe(true);
      });

      it('isThumb(element), element is scrollable scroll element other scrollbar', () => {
        const firstViewModel = new Scrollbar({
          showScrollbar, direction,
        } as ScrollbarProps) as any;

        const invertedDirection = direction === 'vertical' ? 'horizontal' : 'vertical';
        const secondViewModel = new Scrollbar({
          showScrollbar, direction: invertedDirection,
        } as ScrollbarProps) as any;

        const firstScrollbar = mount(viewFunction(firstViewModel) as JSX.Element);
        firstViewModel.scrollbarRef = firstScrollbar.getDOMNode();

        const secondScrollbar = mount(viewFunction(secondViewModel) as JSX.Element);

        expect(firstViewModel.isThumb(secondScrollbar.find('.dx-scrollable-scroll').getDOMNode())).toBe(false);
      });

      it('isThumb(element), element is scrollable content element', () => {
        const viewModel = new Scrollbar({
          showScrollbar, direction,
        } as ScrollbarProps) as any;

        const scrollbar = mount(viewFunction(viewModel as any) as JSX.Element);
        viewModel.scrollbarRef = scrollbar.getDOMNode();

        expect(viewModel.isThumb(scrollbar.find('.dx-scrollable-scroll-content').getDOMNode())).toBe(true);
      });

      it('isThumb(element), element is scrollable content element other scrollbar', () => {
        const firstViewModel = new Scrollbar({
          showScrollbar, direction,
        } as ScrollbarProps) as any;

        const invertedDirection = direction === 'vertical' ? 'horizontal' : 'vertical';
        const secondViewModel = new Scrollbar({
          showScrollbar, direction: invertedDirection,
        } as ScrollbarProps) as any;

        const firstScrollbar = mount(viewFunction(firstViewModel) as JSX.Element);
        firstViewModel.scrollbarRef = firstScrollbar.getDOMNode();

        const secondScrollbar = mount(viewFunction(secondViewModel) as JSX.Element);

        expect(firstViewModel.isThumb(secondScrollbar.find('.dx-scrollable-scroll-content').getDOMNode())).toBe(false);
      });

      it('isThumb(element), element is scrollbar element', () => {
        const viewModel = new Scrollbar({
          showScrollbar, direction,
        } as ScrollbarProps) as any;

        const scrollbar = mount(viewFunction(viewModel as any) as JSX.Element);
        viewModel.scrollbarRef = scrollbar.getDOMNode();
        expect(viewModel.isThumb(scrollbar.getDOMNode())).toBe(false);
      });

      it('getMaxOffset()', () => {
        const viewModel = new Scrollbar({ direction });

        expect(viewModel.getMaxOffset()).toBe(0);
      });

      it('set/get Location(location)', () => {
        const viewModel = new Scrollbar({ direction });

        viewModel.setLocation(100);

        expect(viewModel.getLocation()).toBe(100);
      });

      it('getAxis()', () => {
        const viewModel = new Scrollbar({ direction });

        expect((viewModel as any).getAxis()).toBe(direction === 'horizontal' ? 'x' : 'y');
      });

      it('getProp()', () => {
        const viewModel = new Scrollbar({ direction });

        expect((viewModel as any).getProp()).toBe(direction === 'horizontal' ? 'left' : 'top');
      });

      it('getContainerRef()', () => {
        const ref = {} as HTMLDivElement;

        const viewModel = new Scrollbar({ containerRef: ref });

        expect((viewModel as any).getContainerRef() === ref).toBe(true);
      });

      each([1, 0.5]).describe('ScaleRatio: %o', (scaleRatio) => {
        it('move()', () => {
          const viewModel = new Scrollbar({ scaleRatio }) as any;
          viewModel.cachedVariables.location = 40;

          viewModel.moveContent = jest.fn();
          viewModel.moveTo = jest.fn();
          viewModel.move();

          expect(viewModel.getLocation()).toBe(40);
        });

        it('move(50)', () => {
          const viewModel = new Scrollbar({ scaleRatio }) as any;
          viewModel.cachedVariables.location = 40;

          viewModel.moveContent = jest.fn();
          viewModel.moveTo = jest.fn();
          viewModel.move(50);

          expect(viewModel.getLocation()).toBe(50 * scaleRatio);
        });
      });

      each([100]).describe('ContainerSize: %o', (containerSize) => {
        each([200]).describe('ContentSize: %o', (contentSize) => {
          each([-20, 20, -80, 80, 120, -120]).describe('Location: %o', (location) => {
            it('scrollBy({ x: 10, y: 15 })', () => {
              const delta = { x: 10, y: 15 };
              const OUT_BOUNDS_ACCELERATION = 0.5;

              const viewModel = new Scrollbar({
                direction,
                containerSize,
                contentSize,
              });

              viewModel.cachedVariables.location = location;
              viewModel.scrollStep = jest.fn();

              viewModel.scrollBy(delta);

              const axis = direction === 'horizontal' ? 'x' : 'y';

              expect(viewModel.scrollStep).toBeCalledTimes(1);

              if ((containerSize - contentSize) < location && location < 0) {
                expect(viewModel.scrollStep).toBeCalledWith(delta[axis]);
              } else {
                expect(viewModel.scrollStep).toBeCalledWith(delta[axis] * OUT_BOUNDS_ACCELERATION);
              }
            });
          });
        });
      });
    });
  });
});

describe('Handlers', () => {
  each(['horizontal', 'vertical']).describe('Direction: %o', (direction) => {
    each([true, false]).describe('InertiaEnabled: %o', (inertiaEnabled) => {
      each([true, false]).describe('ThumbScrolling: %o', (thumbScrolling) => {
        each([jest.fn(), undefined, null]).describe('Action: %o', (action) => {
          it('endHandler(e, action)', () => {
            const e = { ...defaultEvent, velocity: { x: 10, y: 20 } };
            const viewModel = new Scrollbar({
              direction,
              inertiaEnabled,
            } as ScrollbarProps);

            mount(viewFunction(viewModel as any) as JSX.Element);

            viewModel.cachedVariables.thumbScrolling = thumbScrolling;
            viewModel.cachedVariables.crossThumbScrolling = true;

            viewModel.endHandler(e, action);

            if (action) {
              expect(action).toHaveBeenCalledTimes(1);
              expect(action).toHaveBeenCalledWith(e);
            }

            expect(viewModel.cachedVariables.thumbScrolling).toEqual(false);
            expect(viewModel.cachedVariables.crossThumbScrolling).toEqual(false);

            let expectedVelocity = 0;

            if (inertiaEnabled && !thumbScrolling) {
              expectedVelocity = e.velocity[direction === 'horizontal' ? 'x' : 'y'];
            }
            expect(viewModel.cachedVariables.velocity).toEqual(expectedVelocity);
          });
        });
      });
    });

    it('stopHandler()', () => {
      const viewModel = new Scrollbar({
        direction,
      } as ScrollbarProps);

      mount(viewFunction(viewModel as any) as JSX.Element);

      viewModel.cachedVariables.thumbScrolling = true;
      viewModel.cachedVariables.crossThumbScrolling = true;

      viewModel.stopHandler();

      expect(viewModel.cachedVariables.thumbScrolling).toEqual(false);
      expect(viewModel.cachedVariables.crossThumbScrolling).toEqual(false);
    });

    each([true, false]).describe('ScrollByThumb: %o', (scrollByThumb) => {
      each([true, false]).describe('IsDxWheelEvent: %o', (isDxWheelEvent) => {
        each(['dx-scrollable-scroll', 'dx-scrollable-scrollbar']).describe('Event target: %o', (targetClass) => {
          each([true, false]).describe('CrossThumbScrolling: %o', (crossThumbScrolling) => {
            each([jest.fn(), undefined]).describe('Action: %o', (action) => {
              it('initHandler(e, action, crossThumbScrolling)', () => {
                const e = { ...defaultEvent, originalEvent: {} };
                if (isDxWheelEvent) {
                  (e as any).originalEvent.type = 'dxmousewheel';
                }

                const viewModel = new Scrollbar({
                  direction,
                  scrollByThumb,
                } as ScrollbarProps);

                const scrollbar = mount(viewFunction(viewModel as any) as JSX.Element);

                const moveToMouseLocation = jest.fn();
                viewModel.moveToMouseLocation = moveToMouseLocation;

                (e.originalEvent as any).target = scrollbar.find(`.${targetClass}`).getDOMNode();
                (viewModel as any).scrollbarRef = scrollbar.getDOMNode();

                viewModel.initHandler(e, action, crossThumbScrolling);

                const isScrollbarClicked = (targetClass !== 'dx-scrollable-scroll' && scrollByThumb);

                if (isDxWheelEvent || !isScrollbarClicked) {
                  expect(moveToMouseLocation).toBeCalledTimes(0);
                } else {
                  expect(moveToMouseLocation).toBeCalledTimes(1);
                  expect(moveToMouseLocation).toHaveBeenCalledWith(e);
                }

                if (isDxWheelEvent) {
                  expect(viewModel.cachedVariables.thumbScrolling).toBe(false);
                  expect(viewModel.cachedVariables.crossThumbScrolling).toBe(false);
                } else {
                  const expectedThumbScrolling = isScrollbarClicked || (scrollByThumb && targetClass === 'dx-scrollable-scroll');

                  expect(viewModel.cachedVariables.thumbScrolling).toBe(expectedThumbScrolling);
                  expect(viewModel.cachedVariables.crossThumbScrolling)
                    .toBe(!expectedThumbScrolling && crossThumbScrolling);
                }

                if (action) {
                  expect(action).toBeCalledTimes(1);
                  expect(action).toBeCalledWith(e);
                }
              });
            });

            each([true, false]).describe('ThumbScrolling: %o', (thumbScrolling) => {
              each([{ x: 30, y: 35 }, { x: 10, y: 40 }]).describe('Event.Delta: %o', (delta) => {
                each([0, 0.2, 0.5, 1]).describe('containerToContentRatio: %o', (containerToContentRatio) => {
                  it('moveHandler(e.delta)', () => {
                    const viewModel = new Scrollbar({
                      direction,
                      scrollByThumb,
                    } as ScrollbarProps);

                    mount(viewFunction(viewModel as any) as JSX.Element);

                    const scrollByHandler = jest.fn();
                    (viewModel as any).scrollBy = scrollByHandler;
                    (viewModel as any).containerToContentRatio = () => containerToContentRatio;

                    viewModel.cachedVariables.thumbScrolling = thumbScrolling;
                    viewModel.cachedVariables.crossThumbScrolling = crossThumbScrolling;

                    viewModel.moveHandler(delta);
                    if (crossThumbScrolling) {
                      expect(scrollByHandler).toBeCalledTimes(0);
                      return;
                    }

                    const expectedDelta = delta;
                    if (thumbScrolling) {
                      const axis = direction === 'horizontal' ? 'x' : 'y';
                      expectedDelta[axis] = -expectedDelta[axis] / containerToContentRatio;
                    }

                    expect(scrollByHandler).toBeCalledTimes(1);
                    expect(scrollByHandler).toHaveBeenCalledWith(expectedDelta);
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});
