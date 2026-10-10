/* Лендинг /mintorg/: карусели, вопросы, форма заявки. Без зависимостей. */
(function () {
	'use strict';

	var root = document.getElementById('mintorg');
	if (!root) {
		return;
	}
	root.classList.add('mt-js');

	var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	/* ---------- Появление блоков при прокрутке ---------- */

	function initReveal() {
		var items = root.querySelectorAll('[data-mt-reveal]');
		if (!('IntersectionObserver' in window) || reduceMotion) {
			items.forEach(function (el) { el.classList.add('is-in'); });
			return;
		}
		// Карточки одного ряда появляются по очереди
		items.forEach(function (el) {
			var siblings = Array.prototype.filter.call(el.parentNode.children, function (node) {
				return node.hasAttribute('data-mt-reveal');
			});
			var index = siblings.indexOf(el);
			if (index > 0) {
				el.style.setProperty('--mt-delay', Math.min(index, 6) * 0.07 + 's');
			}
		});
		var observer = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting) {
					entry.target.classList.add('is-in');
					observer.unobserve(entry.target);
				}
			});
		}, {rootMargin: '0px 0px -8% 0px', threshold: 0.05});
		items.forEach(function (el) { observer.observe(el); });
	}

	/* ---------- Карусели ---------- */

	function initCarousel(carousel) {
		var track = carousel.querySelector('.mt-carousel__track');
		var dotsBox = carousel.querySelector('.mt-carousel__dots');
		var prev = carousel.querySelector('.mt-carousel__arrow--prev');
		var next = carousel.querySelector('.mt-carousel__arrow--next');
		var slides = Array.prototype.slice.call(track.children);
		var positions = [];
		var frame = 0;

		function isScroller() {
			var style = window.getComputedStyle(track);
			return (style.overflowX === 'auto' || style.overflowX === 'scroll') && track.scrollWidth - track.clientWidth > 2;
		}

		function measure() {
			var max = track.scrollWidth - track.clientWidth;
			var padding = parseFloat(window.getComputedStyle(track).paddingLeft) || 0;
			positions = [];
			slides.forEach(function (slide) {
				var pos = Math.max(0, Math.min(max, slide.offsetLeft - padding));
				if (!positions.length || pos - positions[positions.length - 1] > 2) {
					positions.push(pos);
				}
			});
			if (positions.length && max - positions[positions.length - 1] > 2) {
				positions.push(max);
			}
		}

		function currentIndex() {
			var left = track.scrollLeft;
			var best = 0;
			positions.forEach(function (pos, i) {
				if (Math.abs(pos - left) < Math.abs(positions[best] - left)) {
					best = i;
				}
			});
			return best;
		}

		function goTo(index) {
			index = Math.max(0, Math.min(positions.length - 1, index));
			track.scrollTo({left: positions[index], behavior: reduceMotion ? 'auto' : 'smooth'});
		}

		function renderDots() {
			dotsBox.innerHTML = '';
			if (positions.length < 2) {
				return;
			}
			positions.forEach(function (pos, i) {
				var dot = document.createElement('span');
				dot.className = 'mt-carousel__dot';
				dot.addEventListener('click', function () { goTo(i); });
				dotsBox.appendChild(dot);
			});
		}

		function updateState() {
			frame = 0;
			if (!positions.length) {
				return;
			}
			var index = currentIndex();
			Array.prototype.forEach.call(dotsBox.children, function (dot, i) {
				dot.classList.toggle('is-active', i === index);
			});
			if (prev && next) {
				var max = track.scrollWidth - track.clientWidth;
				prev.disabled = track.scrollLeft <= 2;
				next.disabled = track.scrollLeft >= max - 2;
			}
		}

		function refresh() {
			var active = isScroller() && !carousel.classList.contains('is-grid');
			if (active) {
				measure();
				track.setAttribute('tabindex', '0');
			} else {
				positions = [];
				track.removeAttribute('tabindex');
			}
			renderDots();
			if (prev && next) {
				prev.hidden = next.hidden = !active;
			}
			updateState();
		}

		track.addEventListener('scroll', function () {
			if (!frame) {
				frame = window.requestAnimationFrame(updateState);
			}
		}, {passive: true});

		if (prev && next) {
			prev.addEventListener('click', function () { goTo(currentIndex() - 1); });
			next.addEventListener('click', function () { goTo(currentIndex() + 1); });
		}

		if ('ResizeObserver' in window) {
			new ResizeObserver(refresh).observe(track);
		} else {
			window.addEventListener('resize', refresh);
		}
		refresh();
		carousel.mtRefresh = refresh;
	}

	/* «Все кейсы»: лента превращается в сетку. Кнопка нужна, только если кейсов больше четырёх */
	function initCasesToggle() {
		var button = root.querySelector('[data-mt-cases-all]');
		var carousel = root.querySelector('.mt-carousel--cases');
		if (!button || !carousel) {
			return;
		}
		var count = carousel.querySelectorAll('.mt-carousel__slide').length;
		if (count <= 4) {
			return;
		}
		button.hidden = false;
		var label = button.querySelector('[data-mt-label]');
		button.addEventListener('click', function () {
			var grid = carousel.classList.toggle('is-grid');
			label.textContent = grid ? 'Свернуть' : 'Все кейсы';
			button.setAttribute('aria-expanded', grid ? 'true' : 'false');
			if (carousel.mtRefresh) {
				carousel.mtRefresh();
			}
			if (!grid) {
				carousel.scrollIntoView({behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest'});
			}
		});
	}

	/* ---------- Вопросы ---------- */

	function initFaq() {
		root.querySelectorAll('.mt-faq__q button').forEach(function (button) {
			button.addEventListener('click', function () {
				var item = button.closest('.mt-faq__item');
				var open = !item.classList.contains('is-open');
				item.classList.toggle('is-open', open);
				button.setAttribute('aria-expanded', open ? 'true' : 'false');
			});
		});

		var all = root.querySelector('[data-mt-faq-all]');
		var list = root.querySelector('.mt-faq__list');
		if (!all || !list) {
			return;
		}
		if (!list.querySelector('.mt-faq__item--more')) {
			all.hidden = true;
			return;
		}
		var label = all.querySelector('[data-mt-label]');
		all.addEventListener('click', function () {
			var expanded = list.classList.toggle('is-all');
			all.setAttribute('aria-expanded', expanded ? 'true' : 'false');
			label.textContent = expanded ? 'Свернуть' : 'Все вопросы';
			if (expanded) {
				var first = list.querySelector('.mt-faq__item--more button');
				if (first) {
					first.focus({preventScroll: true});
				}
			}
		});
	}

	/* ---------- Переход к форме из первого экрана ---------- */

	function initAnchors(form) {
		root.querySelectorAll('a[href="#mt-consult"]').forEach(function (link) {
			link.addEventListener('click', function (e) {
				var target = document.getElementById('mt-consult');
				if (!target) {
					return;
				}
				e.preventDefault();
				// у шаблона свой обработчик ссылок с «#» (custom.js), он сбивает прокрутку
				e.stopPropagation();
				var topic = link.getAttribute('data-mt-topic');
				var field = form && form.querySelector('[data-mt-topic-field]');
				if (topic && field) {
					field.value = topic;
				}
				// scrollIntoView, а не расчёт координат: на широких экранах у body есть zoom
				target.scrollIntoView({behavior: reduceMotion ? 'auto' : 'smooth', block: 'start'});
				var phone = form && form.querySelector('input[name="phone"]');
				if (phone) {
					window.setTimeout(function () { phone.focus({preventScroll: true}); }, reduceMotion ? 0 : 650);
				}
			});
		});
	}

	/* ---------- Телефон: +7 (999) 999-99-99 ---------- */

	function phoneDigits(value) {
		var digits = String(value).replace(/\+\s*7/, '').replace(/\D/g, '');
		if (digits.length === 11 && (digits.charAt(0) === '8' || digits.charAt(0) === '7')) {
			digits = digits.slice(1);
		}
		return digits.slice(0, 10);
	}

	function formatPhone(digits) {
		var out = '+7 (' + digits.slice(0, 3);
		if (digits.length > 3) {
			out += ') ' + digits.slice(3, 6);
		}
		if (digits.length > 6) {
			out += '-' + digits.slice(6, 8);
		}
		if (digits.length > 8) {
			out += '-' + digits.slice(8, 10);
		}
		return out;
	}

	function caretAfterDigit(formatted, n) {
		var count = 0;
		if (n <= 0) {
			return Math.min(formatted.length, 4);
		}
		for (var i = 4; i < formatted.length; i++) {
			if (/\d/.test(formatted.charAt(i)) && ++count === n) {
				return i + 1;
			}
		}
		return formatted.length;
	}

	function initPhone(input, onComplete) {
		var lastDigits = '';

		input.addEventListener('input', function (e) {
			var raw = input.value;
			var caret = typeof input.selectionStart === 'number' ? input.selectionStart : raw.length;
			var digits = phoneDigits(raw);
			var before = Math.min(phoneDigits(raw.slice(0, caret)).length, digits.length);

			// Backspace по скобке или дефису удаляет цифру перед ними
			if (e.inputType === 'deleteContentBackward' && digits === lastDigits && before > 0) {
				digits = digits.slice(0, before - 1) + digits.slice(before);
				before--;
			}
			lastDigits = digits;

			var focused = document.activeElement === input;
			var formatted = digits || focused ? formatPhone(digits) : '';
			if (input.value !== formatted) {
				input.value = formatted;
			}
			if (focused && input.setSelectionRange) {
				var pos = caretAfterDigit(formatted, before);
				input.setSelectionRange(pos, pos);
			}
			if (digits.length === 10) {
				onComplete();
			}
		});
		input.addEventListener('focus', function () {
			if (!input.value) {
				input.value = '+7 (';
				window.setTimeout(function () {
					if (document.activeElement === input && input.value === '+7 (' && input.setSelectionRange) {
						input.setSelectionRange(4, 4);
					}
				}, 0);
			}
		});
		input.addEventListener('blur', function () {
			var digits = phoneDigits(input.value);
			input.value = digits ? formatPhone(digits) : '';
			lastDigits = digits;
		});
	}

	/* ---------- Форма заявки ---------- */

	function reachGoal(goal) {
		if (!goal) {
			return;
		}
		try {
			if (typeof window.ym === 'function' && window.mtMetrikaId) {
				window.ym(window.mtMetrikaId, 'reachGoal', goal);
				return;
			}
			Object.keys(window).forEach(function (key) {
				if (/^yaCounter\d+$/.test(key) && window[key] && typeof window[key].reachGoal === 'function') {
					window[key].reachGoal(goal);
				}
			});
		} catch (err) {
			// Метрика не должна ломать отправку
		}
	}

	function initForm(form) {
		var phone = form.querySelector('input[name="phone"]');
		var consent = form.querySelector('input[name="consent"]');
		var token = form.querySelector('input[name="mt_token"]');
		var submit = form.querySelector('.mt-form__submit');
		var formError = form.querySelector('.mt-form__error');
		var success = form.querySelector('.mt-form__success');
		var startedAt = Date.now();

		function setError(name, message) {
			var field = form.querySelector('[data-mt-field="' + name + '"]');
			if (!field) {
				return;
			}
			field.classList.toggle('is-invalid', !!message);
			var box = field.querySelector('.mt-field__error');
			if (box) {
				box.textContent = message || '';
			}
			var input = field.querySelector('input');
			if (input) {
				input.setAttribute('aria-invalid', message ? 'true' : 'false');
			}
		}

		function validate() {
			var errors = {};
			var digits = phoneDigits(phone.value);
			if (!digits.length) {
				errors.phone = 'Укажите номер телефона';
			} else if (digits.length < 10) {
				errors.phone = 'Номер указан не полностью';
			}
			if (!consent.checked) {
				errors.consent = 'Подтвердите согласие на обработку персональных данных';
			}
			return errors;
		}

		function showErrors(errors) {
			['phone', 'consent'].forEach(function (name) {
				setError(name, errors[name] || '');
			});
			var first = form.querySelector('.is-invalid input');
			if (first) {
				first.focus();
			}
		}

		function showSuccess(demo) {
			if (demo && !success.querySelector('.mt-form__success-demo')) {
				var note = document.createElement('p');
				note.className = 'mt-form__success-demo';
				note.textContent = 'Это предпросмотр страницы: заявка никуда не отправлена.';
				success.appendChild(note);
			}
			success.hidden = false;
			success.focus({preventScroll: true});
			reachGoal(form.getAttribute('data-mt-goal'));
		}

		function setLoading(state) {
			form.classList.toggle('is-loading', state);
			submit.disabled = state;
		}

		initPhone(phone, function () { setError('phone', ''); });
		consent.addEventListener('change', function () {
			if (consent.checked) {
				setError('consent', '');
			}
		});
		form.addEventListener('focusin', function () {
			if (!token.value) {
				token.value = 'mt-' + Math.random().toString(36).slice(2, 12);
			}
		});

		form.addEventListener('submit', function (e) {
			e.preventDefault();
			formError.hidden = true;
			var errors = validate();
			if (Object.keys(errors).length) {
				showErrors(errors);
				return;
			}
			showErrors({});

			if (form.hasAttribute('data-mt-demo')) {
				showSuccess(true);
				return;
			}

			var data = new FormData(form);
			data.set('phone', formatPhone(phoneDigits(phone.value)));
			data.set('mt_elapsed', String(Date.now() - startedAt));
			data.set('page', window.location.href);
			if (!token.value) {
				data.set('mt_token', 'mt-' + Math.random().toString(36).slice(2, 12));
			}

			setLoading(true);
			fetch(form.action, {method: 'POST', body: data, credentials: 'same-origin', headers: {'X-Requested-With': 'XMLHttpRequest'}})
				.then(function (response) { return response.json(); })
				.then(function (result) {
					setLoading(false);
					if (result && (result.ok || result.success)) {
						showSuccess(false);
					} else if (result && result.errors) {
						showErrors(result.errors);
					} else {
						throw new Error((result && result.message) || 'error');
					}
				})
				.catch(function () {
					setLoading(false);
					formError.textContent = 'Не удалось отправить заявку. Попробуйте ещё раз или позвоните нам.';
					formError.hidden = false;
				});
		});
	}

	initReveal();
	root.querySelectorAll('[data-mt-carousel]').forEach(initCarousel);
	initCasesToggle();
	initFaq();

	var form = root.querySelector('[data-mt-form]');
	if (form) {
		initForm(form);
	}
	initAnchors(form);
})();
