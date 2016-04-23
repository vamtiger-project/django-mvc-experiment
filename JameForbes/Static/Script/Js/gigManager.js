var webPage;

$(function () {
	webPage = new WebPage();
});

var WebPage = function () {
	this.regex = this.getRegex();
	this.html = this.getHtml();
	
	this.setup({type: "primary"});
};

WebPage.prototype.getRegex = function () {
	var webPage = this;
	var regex;

	setRegexPatterns();
	setRegexMethods();

	return regex;

	function setRegexPatterns() {
		regex = {
			allGrouped: /(.*)/,

			False: /^False$/, // Python Boolean
			false: /^false$/,
			True: /^True$/, // Python Boolean
			true: /^true$/,

			closeOpenSpan: /(<\/span>)(<span>)/g, // With global flag
			openCloseNav: /(<nav>)(<\/nav)/,

			hidden: /^hidden$/,
			visible: /^visible$/,

			nothing: /^$/,

			off: /^off$/,
			on: /^on$/,

			year: /^year$/,

			notes: /^notes$/,

			singleDigit: /^(\d)$/,

			globalWhiteSpace: /\s+/g,

			domElement: /^(HTML|SVG).*Element$/,

			Number: /^Number$/,
			floatOrInt: /^\d+\.\d+|\d+$/,

			nonTelephone: /[^\d+]/,
			plus: /\+/,
			plusGlobal: /\+/g,

			nonCurrency: /[^\d.]|^\./,
			period: /\./,
			periodGlobal: /\./g,
			dollarsDotCents: /(\d+)(\.)(\d{1,2})/,

			nonEmail: /['"(),:;<>\[\]\\/]|^\.|^@/, // Non email characters - According to Wikipedia
			at: /@/,
			atGlobal: /@/g,
			doubleDot: /\.\./,
			trailingDot: /^.*\.$/,

			invalidRequiredFields: /^invalidRequiredFields$/,

			isoDate: /(\d+)-(\d{1,2})-(\d{1,2})/,

			published: /^published$/,
		};
	}

	function setRegexMethods() {
		regex.addRegexPattern = addRegexPattern;
		regex.replacementText = replacementText();
		regex.doubleDigitFormat = doubleDigitFormat;
		regex.telephoneNumberFormat = telephoneNumberFormat;
		regex.inputFormat = inputFormat;

		function addRegexPattern(info) {
			var regexPatternExists = info.pattern in webPage.regex;

			if (!regexPatternExists) {
				webPage.regex[info.pattern] = new RegExp("^" + info.pattern + "$", info.flags);
			}
		}

		function replacementText() {
			var replacementText = {
				nothing: "",
				group1: "$1",
				doubleDigit: "0$1",
				sqlDate: "$3/$2/$1",
			};

			return replacementText;
		}

		function doubleDigitFormat(digit) {
			var doubleDigit;

			if (digit < 10) {
				doubleDigit = String(digit).replace(webPage.regex.singleDigit, webPage.regex.replacementText.doubleDigit);
			} else {
				doubleDigit = digit;
			}

			return doubleDigit;
		}

		function telephoneNumberFormat(telephoneNumber) {
			var telephoneNumberFormatted = "";
			var telephoneNumbers = String(telephoneNumber).replace(webPage.regex.globalWhiteSpace, "").split("").reverse();
			var forthNumberParsed = false;
			var thirdNumberTracker = 0;
			var numberCount = 0;

			$.each(telephoneNumbers, function (numberIndex, number) {
				numberCount += 1;

				telephoneNumberFormatted += number;

				if (numberCount === 4) {
					telephoneNumberFormatted += " ";
					forthNumberParsed = true;
				} else if (forthNumberParsed) {
					thirdNumberTracker += 1;

					if (thirdNumberTracker === 3) {
						telephoneNumberFormatted += " ";
						thirdNumberTracker = 0;
					}
				}
			});

			return telephoneNumberFormatted.split("").reverse().join("");
		}

		function inputFormat(info) {
			var formatInput = {
				telephone: telephone,
				invoice: invoice,
				email: email,

			};

			formatInput[info.input]();

			function telephone() {
				removeInvalidCharacters();
				ensureCorrectFormat();

				function removeInvalidCharacters() {
					info.target.value = info.target.value.replace(webPage.regex.nonTelephone, webPage.regex.replacementText.nothing);					
				}

				function ensureCorrectFormat() {
					removeExtraPlus();

					function removeExtraPlus() {
						if (webPage.regex.plus.test(info.target.value)) {
							var plusCount = info.target.value.match(webPage.regex.plusGlobal).length;

							if (plusCount > 1) {
								info.target.value = info.target.value.slice(0, info.target.value.length - 1);
							}
						}
					}
				}				
			}

			function invoice() {
				removeInvalidCharacters();
				ensureCorrectFormat();

				function removeInvalidCharacters() {
					info.target.value = info.target.value.replace(webPage.regex.nonCurrency, webPage.regex.replacementText.nothing);
				}

				function ensureCorrectFormat() {
					removeExtraPeriod();
					formatCents();

					function removeExtraPeriod() {
						if (webPage.regex.period.test(info.target.value)) {
							var periodCount = info.target.value.match(webPage.regex.periodGlobal).length;

							if (periodCount > 1) {
								info.target.value = info.target.value.slice(0, info.target.value.length - 1);
							}
						}
					}

					function formatCents() {
						if (webPage.regex.dollarsDotCents.test(info.target.value)) {
							var dollarsDotCents = webPage.regex.dollarsDotCents.exec(info.target.value);
							var dollars = dollarsDotCents[1];
							var dot = dollarsDotCents[2];
							var cents = dollarsDotCents[3];

							info.target.value = dollars + dot + cents;
						}
					}
				}
			}

			function email() {
				removeInvalidCharacters();
				ensureCorrectFormat();

				function removeInvalidCharacters() {
					info.target.value = info.target.value.replace(webPage.regex.nonEmail, webPage.regex.replacementText.nothing);
				}

				function ensureCorrectFormat() {
					preventDoubleDot();
					removeExtraAt();

					function preventDoubleDot() {
						if (webPage.regex.doubleDot.test(info.target.value)) {
							info.target.value = info.target.value.slice(0, info.target.value.length - 1);
						}
					}

					function removeExtraAt() {
						if (webPage.regex.at.test(info.target.value)) {
							var atCount = info.target.value.match(webPage.regex.atGlobal).length;

							if (atCount > 1) {
								info.target.value = info.target.value.slice(0, info.target.value.length - 1);
							}
						}
					}					
				}
			}
		}
	}
};

WebPage.prototype.getHtml = function () {
	var webPage = this;
	var html = new function () {
		this.body = getBodyHtml();
		this.getGigStatus = null; // Set this method when the gig info is loaded for the first time.
		this.selection = getSelection;
		this.data = getData();
		this.svg = getSvg;
		this.innerHtml = innerHtml;
		this.doNothing = function () {};
	};

	return html;

	function getBodyHtml() {
		var bodyHtml = new function () {
			this.$navigation = getNavigation();
			this.$gigInfoTableSection = null;
			this.$statusMenu = this.$dayMenu = this.$monthMenu = this.$yearMenu = null;
			this.$gigViewerSection = getGigViewerSection();
			this.$dialogBox = getDialogBox();
			this.$metricElement = $("<span id = 'metricElement'><span>");

			setTimeout(requestMostRecentYearGigInfo, 550); // Corresponds to transition
		};

		return bodyHtml;

		function getNavigation() {
			var $navigation = $([
				"<nav>",
					"<span>",
						"Count",
					"</span>",
					"<span>",
						"Status",
					"</span>",
					"<span>",
						"Day",
					"</span>",
					"<span>",
						"Date",
					"</span>",
					"<span>",
						"Month",
					"</span>",
					"<span>",
						"Year",
					"</span>",
					"<span>",
						"Start",
					"</span>",
					"<span>",
						"End",
					"</span>",
					"<span>",
						"Venue",
					"</span>",
				"</nav>",
			].join(""));

			return $navigation;
		}

		function requestMostRecentYearGigInfo() {
			$.ajax({
				url: "/loadGigInfo/",
				dataType: "json",
				success: processGigInfo,
				error: reqeustGigInfoError,
				data: {
					gigInfoRequestMethod: "initialize",
				},
			});

			function processGigInfo(mostRecentGigInfo) {
				setGigInfoTable();
				setGigInfoHeaderMenus();
				webPage.setup({type: "mostRecentGigInfoLoaded"});

				function setGigInfoTable() {
					var gigInfoTableString = "";

					$.each(mostRecentGigInfo.gigs, function (gigIndex, gig){
						gigInfoTableString += webPage.html.innerHtml({type: "gigInfoTableRow", gig: gig, gigIndex: gigIndex});
					});

					gigInfoTableString = gigInfoTableString.replace(webPage.regex.allGrouped, [
						"<section>",
							"<table>",
								"<tbody>",
									"$1",
								"</tbody>",
							"</table>",
						"</section>",
					].join(""));

					webPage.html.body.$gigInfoTableSection = $(gigInfoTableString);
				}

				function setGigInfoHeaderMenus() {
					var menuHeaders = [
						"status",
						"day",
						"month",
						"year",
					];

					$.each(menuHeaders, function (menuHeaderIndex, menuHeader) {
						setHeaderMenuOptions();

						function setHeaderMenuOptions() {
							var headerMenuOptions;
							var headerMenuOptionsString = "";
							var setHeaderMenuOptions = {
								status: status,
								day: day,
								month: month,
								year: year,
							};

							setHeaderMenuOptions[menuHeader]();
							setHeaderMenuOptionFigures();
							setHeaderMenuOptionsString();
							setHeaderMenuReference();

							return headerMenuOptionsString;

							function status() {
								headerMenuOptions = [
									"Paid",
									"Unpaid",
									"Cancelled",
								];
							}

							function day() {
								headerMenuOptions = mostRecentGigInfo.days;
							}

							function month() {
								headerMenuOptions = mostRecentGigInfo.months;
							}

							function year() {
								headerMenuOptions = mostRecentGigInfo.years;
							}

							function setHeaderMenuOptionFigures() {
								var menuOptionFigure;
								var getHeaderMenuOptionFigure = new function () {
									this.status = status;
									this.day = this.month = this.year = menuOptionToggleFigure;
								};

								$.each(headerMenuOptions, function (menuOptionIndex, menuOption) {
									headerMenuOptions[menuOptionIndex] = getHeaderMenuOptionFigure[menuHeader](menuOption) + menuOption;
								});

								function status(gigStatus) {
									var menuOptionFigure;
									var gigStatusPresent = new function () {
										this.Paid = Paid;
										this.Unpaid = Unpaid;
										this.Cancelled = Cancelled;
									};

									if (!gigStatusPresent[gigStatus]()) {
										menuOptionFigure = "<figure data-present = 'false'></figure>"
									} else {
										menuOptionFigure = "<figure data-present = 'true'></figure>"
									}

									return menuOptionFigure;

									function Paid() {
										return webPage.html.selection("firstPaidGig");
									}

									function Unpaid() {
										return webPage.html.selection("firstUnpaidGig");
									}

									function Cancelled() {
										return webPage.html.selection("firstCancelledGig")
									}
								}

								function menuOptionToggleFigure(cellValue) {
									var menuOptionFigure;
									var columnCells;
									var setColumnCells = {
										day: day,
										month: month,
										year: year,
									};

									setColumnCells[menuHeader]();

									if (columnCells.length > 0) {
										menuOptionFigure = "<figure data-present = 'true'></figure>";
									} else {
										menuOptionFigure = "<figure data-present = 'false'></figure>";
									}

									return menuOptionFigure;

									function day() {
										columnCells = webPage.html.selection("allDayCells").filter(":contains(" + cellValue +  ")");
									}

									function month() {
										columnCells = webPage.html.selection("allMonthCells").filter(":contains(" + cellValue +  ")");
										
									}

									function year() {
										columnCells = webPage.html.selection("allYearCells").filter(":contains(" + cellValue +  ")");
									}
								}
							}

							function setHeaderMenuOptionsString() {
								$.each(headerMenuOptions, function (menuOptionIndex, menuOption) {
									headerMenuOptionsString += [
										"<li>",
											menuOption,
										"</li>",
									].join("");
								});

								headerMenuOptionsString = [
									"<ul data-menu = '" + menuHeader + "'>",
										headerMenuOptionsString,
									"</ul>",
								].join("");
							}

							function setHeaderMenuReference() {
								var setMenuReferene = {
									status: status,
									day: day,
									month: month,
									year: year,
								};

								setMenuReferene[menuHeader]();

								function status() {
									webPage.html.body.$statusMenu = $(headerMenuOptionsString);
									setMenuOptionSelectability(webPage.html.body.$statusMenu);
								}

								function day() {
									webPage.html.body.$dayMenu = $(headerMenuOptionsString);
									setMenuOptionSelectability(webPage.html.body.$dayMenu);
								}

								function month() {
									webPage.html.body.$monthMenu = $(headerMenuOptionsString);
									setMenuOptionSelectability(webPage.html.body.$monthMenu);
								}

								function year() {
									webPage.html.body.$yearMenu = $(headerMenuOptionsString);
									setMenuOptionSelectability(webPage.html.body.$yearMenu);
								}

								function setMenuOptionSelectability(menu) {
									$.each(menu.find("figure[data-present]"), function (menuOptionFigureIndex, menuOptionFigure) {
										menuOptionFigure.parentNode.dataset.selectable = menuOptionFigure.dataset.present;
										
										setMenuOptionToggle(menuOptionFigure.parentNode.dataset.selectable);

										function setMenuOptionToggle(menuOptionSelectability) {
											var setToggle = {
												true: menuOptionToggleOn,
												false: menuOptionToggleOnIfYearOption,
											};

											
											setToggle[menuOptionSelectability]();

											function menuOptionToggleOn() {
												menuOptionFigure.parentNode.dataset.toggle = "on";
											}

											function menuOptionToggleOnIfYearOption() {
												if (webPage.regex.year.test(menu[0].dataset.menu)) {
													menuOptionFigure.parentNode.dataset.toggle = "off";
													menuOptionFigure.parentNode.dataset.selectable = "true";
													menuOptionFigure.dataset.present = "true";
												}
											}
										}
									});
								}
							}
						}
					});
				}
			}

			function reqeustGigInfoError(xhr, status, strError) {
				console.log("Error requesting information for the most recent gigs:", strError);
			}
		}

		function getGigViewerSection() {
			var gigViewerSection = $([
				"<section>",
					"<form id = 'gigInfoUpdateForm' data-db-id>",
						"<h1>",
							"Gig Viewer",
						"</h1>",
						"<table>",
							"<tbody>",
								"<tr>",
									"<td>",
										"<label for = 'venue'>",
											"Venue:",
										"</label>",
									"</td>",
									"<td>",
										"<input type = 'text' name = 'venue' placeholder = 'Enter venue' maxlength = '100' size = '30' list = 'venueList' autocomplete = 'off'>",
										"<datalist id = 'venueList'></datalist>",
									"</td>",
								"</tr>",
								"<tr>",
									"<td>",
										"<label for = 'date'>",
											"Date:",
										"</label>",
									"</td>",
									"<td>",
										"<input type = 'date' name = 'date'>",
									"</td>",
								"</tr>",
								"<tr>",
									"<td>",
										"<label for = 'startTime'>",
											"Start:",
										"</label>",
									"</td>",
									"<td>",
										"<input type = 'time' name = 'startTime'>",
									"</td>",
								"</tr>",
								"<tr>",
									"<td>",
										"<label for = 'endTime'>",
											"End:",
										"</label>",
									"</td>",
									"<td>",
										"<input type = 'time' name = 'endTime'>",
									"</td>",
								"</tr>",
								"<tr>",
									"<td>",
										"<label for = 'invoice'>",
											"Invoice:",
										"</label>",
									"</td>",
									"<td>",
										"<span id = 'currency'>$</span>", "<input type = 'text' name = 'invoice' size = 12 placeholder = 'Dollars'>",
									"</td>",
								"</tr>",
								"<tr>",
									"<td>",
										"<label for = 'status'>",
											"Status:",
										"</label>",
									"</td>",
									"<td>",
										"<select name = 'status'>",
											"<option value = 'paid'>",
												"Paid",
											"</option>",
											"<option value = 'unpaid'>",
												"Unpaid",
											"</option>",
											"<option value = 'cancelled'>",
												"Cancelled",
											"</option>",
										"</select>",
									"</td>",
								"</tr>",
								"<tr>",
									"<td>",
										"<label for = 'reference'>",
											"Reference:",
										"</label>",
									"</td>",
									"<td>",
										"<input type = 'text' name = 'reference' list = 'referenceList' size = 30 placeholder = 'Reference Name' autocomplete = 'off'>",
										"<datalist id = 'referenceList'></datalist>",
									"</td>",
								"</tr>",
								"<tr>",
									"<td>",
										"<label for = 'email'>",
											"Email:",
										"</label>",
									"</td>",
									"<td>",
										"<input type = 'email' name = 'email' list = 'emailList' size = 30 placeholder = 'E-mail address' autocomplete = 'off'>",
										"<datalist id = 'emailList'></datalist>",
									"</td>",
								"</tr>",
								"<tr>",
									"<td>",
										"<label for = 'telephone'>",
											"Telephone:",
										"</label>",
									"</td>",
									"<td>",
										"<input type = 'tel' name = 'telephone'  list = 'telephoneList' size = 17  maxlength = '12' placeholder = 'Telephone no.' autocomplete = 'off'>",
										"<datalist id = 'telephoneList'></datalist>",
									"</td>",
								"</tr>",
							"</tbody>",
						"</table>",
						"<label for = 'notes'>",
							"Notes:",
						"</label>",
						"<br>",
						"<textarea name = 'notes' rows = '10' cols = '50' form = 'gigInfoUpdateForm' placeholder = 'Enter your notes here...' data-active = 'false'>",
						"</textArea>",
						"<br>",
						"<input type = 'button' name = 'close' value = 'Close'>",
						"<input type = 'button' name = 'publish' value = 'Publish'>",
						"<input type = 'button' name = 'save' value = 'Save'>",
						"<input type = 'button' name = 'new' value = 'New'>",
					"</form>",
				"</section",
			].join(""));

			return gigViewerSection;
		}

		function getDialogBox() {
			var dialogBox = $([
				"<section>",
				"</section>",
			].join(""));

			return dialogBox;
		}
	}

	function getSvg(svgName) {
		var svg;
		var setSvg = {
			attention: attention,
			error: error,
			success: success,
			chrome: chrome,
			excel: excel,
		};

		setSvg[svgName]();

		return svg;

		function attention() {
			svg = '<svg version="1.1" id="invalidRequiredFieldsDialogAttentionSvg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 176.96 156.527"><g id="Atttention"><g id="Triangle_1_"><g id="Outer_1_"><path fill="#CD2F2C" d="M12.352,146.027c-1.649,0-2.325-1.169-1.5-2.598L86.98,11.572c0.825-1.429,2.175-1.429,3,0l76.128,131.857c0.825,1.429,0.149,2.598-1.5,2.598H12.352z"/><path fill="none" stroke="#CD2F2C" stroke-width="21" stroke-miterlimit="10" d="M12.352,146.027c-1.649,0-2.325-1.169-1.5-2.598L86.98,11.572c0.825-1.429,2.175-1.429,3,0l76.128,131.857c0.825,1.429,0.149,2.598-1.5,2.598H12.352z"/></g><g id="Inner_1_"><path fill="#FFFFFF" d="M26.208,138.027c-1.65,0-2.325-1.169-1.5-2.598L86.98,27.572c0.825-1.429,2.175-1.429,3,0l62.271,107.857c0.825,1.429,0.15,2.598-1.5,2.598H26.208z"/><path fill="none" stroke="#FFFFFF" stroke-width="8" stroke-miterlimit="10" d="M26.208,138.027c-1.65,0-2.325-1.169-1.5-2.598L86.98,27.572c0.825-1.429,2.175-1.429,3,0l62.271,107.857c0.825,1.429,0.15,2.598-1.5,2.598H26.208z"/></g></g><g id="Exclaimation_1_"><g><path fill="#231F20" d="M97.187,67.966c0,0.148,0,0.308,0,0.499c-0.119,2.033-0.553,4.106-1.305,6.232c-0.746,2.133-1.521,4.532-2.318,7.217c-0.941,2.87-1.791,6.223-2.562,10.055c-0.785,3.844-1.168,8.393-1.168,13.663H87.13c0-5.271-0.389-9.819-1.166-13.663c-0.771-3.832-1.594-7.185-2.469-10.055c-0.865-2.685-1.674-5.084-2.414-7.217c-0.752-2.126-1.184-4.199-1.309-6.232c0-0.191,0-0.351,0-0.499c0-0.136,0-0.251,0-0.349c0-3.604,0.854-6.665,2.562-9.219c1.703-2.531,3.768-3.811,6.189-3.811c2.367,0,4.396,1.279,6.104,3.811c1.703,2.554,2.559,5.615,2.559,9.219C97.187,67.715,97.187,67.83,97.187,67.966z"/></g><g><path fill="#231F20" d="M93.923,126.219c-1.49,1.467-3.285,2.194-5.375,2.194s-3.881-0.728-5.375-2.194c-1.5-1.462-2.238-3.234-2.238-5.329c0-2.091,0.738-3.87,2.238-5.333c1.494-1.463,3.285-2.197,5.375-2.197s3.885,0.734,5.375,2.197c1.5,1.463,2.24,3.242,2.24,5.333C96.164,122.984,95.423,124.757,93.923,126.219z"/></g></g></g></svg>';
		}

		function error() {
			svg = '<svg version="1.1" id="errorSvg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 181.473 181.472"><g id="Critical"><g><path fill="#CE312D" d="M135.392,174.401c-3.89,3.889-11.571,7.071-17.071,7.071l-55.168,0c-5.5,0-13.182-3.182-17.071-7.071L7.072,135.391c-3.89-3.889-7.071-11.571-7.071-17.071L0,63.152c0-5.5,3.182-13.182,7.071-17.071l39.01-39.01C49.971,3.183,57.652,0,63.152,0l55.168,0c5.5,0,13.183,3.182,17.071,7.071l39.009,39.01c3.89,3.889,7.071,11.571,7.071,17.071l0.001,55.167c0,5.5-3.182,13.182-7.071,17.071L135.392,174.401z"/></g><g><path fill="#FFFFFF" d="M115.122,47.911c3.5-3.5,9.228-3.5,12.729,0l5.713,5.712c3.5,3.5,3.5,9.228-0.001,12.728l-18.017,18.017c-3.5,3.5-3.5,9.228,0,12.728l18.018,18.018c3.5,3.5,3.5,9.228,0,12.728l-5.721,5.722c-3.5,3.5-9.229,3.5-12.729,0l-18.018-18.018c-3.5-3.5-9.229-3.5-12.729,0l-18.016,18.017c-3.5,3.5-9.229,3.5-12.729,0l-5.713-5.713c-3.5-3.5-3.5-9.228,0-12.728l18.017-18.017c3.501-3.5,3.501-9.228,0-12.728L47.911,66.359c-3.5-3.5-3.5-9.228,0-12.728l5.721-5.722c3.5-3.5,9.229-3.5,12.729,0l18.017,18.018c3.501,3.5,9.228,3.5,12.729,0L115.122,47.911z"/></g></g></svg>';
		}

		function success() {
			svg = '<svg version="1.1" id="successSvg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14.238 15.162"><g id="success"><g id="circle"><path fill="#7AAE37" d="M7.49,0.029c0.995-0.092,1.928,0.039,2.766,0.35c0.832,0.31,1.568,0.797,2.174,1.424c0.602,0.622,1.074,1.381,1.385,2.24c0.309,0.853,0.459,1.806,0.416,2.822c-0.041,1.012-0.271,1.996-0.648,2.91s-0.902,1.761-1.541,2.499c-0.639,0.739-1.391,1.372-2.223,1.855c-0.834,0.485-1.75,0.819-2.71,0.96c-0.967,0.141-1.891,0.07-2.734-0.178c-0.85-0.251-1.618-0.684-2.267-1.266c-0.652-0.587-1.182-1.325-1.547-2.181C0.192,10.605-0.008,9.626,0,8.566c0.008-1.065,0.227-2.109,0.616-3.083C1.005,4.507,1.564,3.605,2.25,2.826C2.935,2.047,3.745,1.393,4.636,0.91C5.523,0.43,6.489,0.121,7.49,0.029z M7.125,14.396c0.871-0.125,1.701-0.428,2.458-0.865c0.754-0.438,1.438-1.011,2.018-1.682c0.578-0.67,1.057-1.438,1.398-2.267s0.547-1.723,0.584-2.64c0.037-0.922-0.1-1.785-0.381-2.557c-0.285-0.777-0.715-1.462-1.26-2.024c-0.551-0.565-1.219-1.004-1.971-1.281c-0.758-0.279-1.604-0.395-2.501-0.31C6.568,0.857,5.696,1.138,4.896,1.573C4.092,2.009,3.363,2.6,2.745,3.303S1.623,4.819,1.271,5.699c-0.352,0.878-0.55,1.821-0.56,2.782c-0.009,0.956,0.17,1.841,0.5,2.62c0.328,0.773,0.805,1.443,1.394,1.975c0.584,0.529,1.277,0.923,2.046,1.152C5.414,14.455,6.25,14.521,7.125,14.396"/></g><path id="tick" fill="#7AAE37" d="M11.105,3.92c0.172-0.018,0.32-0.022,0.447-0.017s0.234,0.019,0.318,0.035c0.086,0.016,0.15,0.035,0.195,0.05s0.068,0.027,0.072,0.029c-0.006,0-0.01,0.001-0.016,0.002c-0.006,0-0.012,0.001-0.018,0.001c-0.004,0-0.01,0.001-0.016,0.001c-0.004,0-0.01,0.001-0.016,0.002c-1.121,0.12-2.217,0.667-3.232,1.43C7.822,6.22,6.886,7.199,6.084,8.176c-0.802,0.979-1.466,1.951-1.942,2.703c-0.478,0.753-0.766,1.284-0.818,1.381l-1.873-3.32L3.6,10.034c0.906-1.233,1.748-2.224,2.521-3.02c0.771-0.793,1.474-1.391,2.105-1.838C8.855,4.73,9.41,4.434,9.893,4.24C10.371,4.046,10.777,3.955,11.105,3.92z"/></g></svg>';
		}

		function chrome() {
			svg = '<svg version="1.1" id="googleChromeSvg" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 435.817 437.46"><path fill="#E6312A" d="M217.341,0.039c0,0,128.478-5.783,196.57,123.337c-35.975,0-207.495,0-207.495,0s-39.187-1.289-72.592,46.255c-9.634,19.916-19.911,40.473-8.349,80.937C108.773,222.309,36.824,97.04,36.824,97.04S87.578,5.176,217.341,0.039z"/><path fill="#FEDA00" d="M407.223,327.87c0,0-59.247,114.143-205.118,108.533c17.995-31.147,103.772-179.681,103.772-179.681s20.709-33.289-3.744-85.991c-12.431-18.305-25.09-37.486-65.919-47.713c32.836-0.326,177.285,0.021,177.285,0.021S467.667,212.93,407.223,327.87z"/><path fill="#65B54C" d="M28.373,328.738c0,0-69.223-108.394,8.58-231.908c17.979,31.16,103.71,179.72,103.71,179.72s18.469,34.578,76.341,39.756c22.061-1.609,45.007-2.982,74.28-33.223c-16.139,28.594-88.673,153.521-88.673,153.521S97.681,438.56,28.373,328.738z"/><path fill="#60AC48" d="M202.105,437.46l29.186-121.792c0,0,32.092-2.505,58.983-32.017C273.581,313.016,202.105,437.46,202.105,437.46z"/><path fill="#FFFFFF" d="M119.59,220.093c0-53.69,43.52-97.215,97.215-97.215c53.69,0,97.214,43.524,97.214,97.215c0,53.694-43.523,97.218-97.214,97.218C163.11,317.311,119.59,273.787,119.59,220.093z"/><linearGradient id="SVGID_1_" gradientUnits="userSpaceOnUse" x1="216.8032" y1="140.2954" x2="216.8032" y2="296.1936"><stop  offset="0" style="stop-color:#96C1E9"/><stop  offset="1" style="stop-color:#146CB5"/></linearGradient><path fill="url(#SVGID_1_)" d="M135.86,220.093c0-44.702,36.238-80.941,80.945-80.941c44.698,0,80.94,36.239,80.94,80.941c0,44.703-36.242,80.945-80.94,80.945C172.098,301.038,135.86,264.795,135.86,220.093z"/><path fill="#F1CF00" d="M413.5,123.039l-120.182,35.237c0,0-18.123-26.596-57.104-35.258C269.989,122.903,413.5,123.039,413.5,123.039z"/><path fill="#DA3027" d="M123.137,246.197c-16.89-29.25-86.31-149.16-86.31-149.16l89.03,88.07c0,0-9.15,18.82-5.68,45.7L123.137,246.197z"/></svg>';
		}

		function excel() {
			svg = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 85.25 80.75"><g id="bg"><g><linearGradient id="SVGID_1_" gradientUnits="userSpaceOnUse" x1="4.0503" y1="16.5332" x2="71.0823" y2="60.378"><stop  offset="0" style="stop-color:#E9F1E6"/><stop  offset="1" style="stop-color:#BFDAB7"/></linearGradient><path fill="url(#SVGID_1_)" d="M0.5,80.25V24.625C0.5,9.293,8.519,0.5,22.5,0.5h58v79.75H0.5z"/><path fill="#CD7E2F" d="M80,1v78.75H1V24.625C1,9.611,8.836,1,22.5,1H80 M81,0c0,0-41.999,0-58.5,0C9.25,0,0,8.125,0,24.625c0,9,0,56.125,0,56.125h81V0L81,0z"/></g></g><g id="Layer_2_copy"><radialGradient id="SVGID_2_" cx="7.1362" cy="36.209" r="93.6294" gradientUnits="userSpaceOnUse"><stop  offset="0" style="stop-color:#DBEAD6"/><stop  offset="0.4788" style="stop-color:#BFDAB7"/><stop  offset="0.9152" style="stop-color:#A3CF9E"/></radialGradient><path fill="url(#SVGID_2_)" d="M0,54.625c0,9,0,26.125,0,26.125h81V23c0,0,8.001,0-8.5,0C48.792,23,0,38.125,0,54.625z"/></g><g id="innerline"><path fill="#FFFFFF" d="M79,2v76.75H2V24.625C2,10.246,9.472,2,22.5,2H79 M81,0c0,0-41.999,0-58.5,0C9.25,0,0,8.125,0,24.625c0,9,0,56.125,0,56.125h81V0L81,0z"/></g><g id="outline"><path fill="#226F37" d="M80,1v78.75H1V24.625C1,9.611,8.836,1,22.5,1H80 M81,0c0,0-41.999,0-58.5,0C9.25,0,0,8.125,0,24.625c0,9,0,56.125,0,56.125h81V0L81,0z"/></g><g id="Layer_2_copy_3"></g><g id="Layer_17"></g><g id="Layer_2_copy_4"></g><g id="innerline_copy_2"><g><defs><path id="SVGID_3_" d="M0,24.625c0,9,0,54.125,0,54.125h88V0c0,0-48.999,0-65.5,0C9.25,0,0,8.125,0,24.625z"/></defs><clipPath id="SVGID_4_"><use xlink:href="#SVGID_3_"  overflow="visible"/></clipPath><g clip-path="url(#SVGID_4_)"><g><image overflow="visible" opacity="0.6" width="353" height="345" xlink:href="data:image/png;base64,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" transform="matrix(0.24 0 0 0.24 1.2617 23.2959)"></image><g><linearGradient id="SVGID_5_" gradientUnits="userSpaceOnUse" x1="18.2915" y1="50.1709" x2="88.5915" y2="94.3283"><stop  offset="0" style="stop-color:#FFFFFF"/><stop  offset="1" style="stop-color:#D4F2CB"/></linearGradient><polygon fill="url(#SVGID_5_)" points="22.75,25.046 84.137,47.37 64.065,106.176 1.012,83.477 "/></g></g><g><g><linearGradient id="SVGID_6_" gradientUnits="userSpaceOnUse" x1="61.2891" y1="47.4902" x2="73.4602" y2="55.1353"><stop  offset="0" style="stop-color:#7AA33C"/><stop  offset="1" style="stop-color:#36874D"/></linearGradient><polygon fill="url(#SVGID_6_)" points="60.258,50.274 61.441,47.248 74.492,52.351 73.309,55.377 "/><path fill="#316E4F" d="M61.653,47.734l12.353,4.829l-0.91,2.327l-12.353-4.829L61.653,47.734 M61.228,46.763l-1.456,3.725l13.75,5.375l1.456-3.725L61.228,46.763L61.228,46.763z"/></g></g><g><g><linearGradient id="SVGID_7_" gradientUnits="userSpaceOnUse" x1="58.2881" y1="55.4893" x2="70.4601" y2="63.1348"><stop  offset="0" style="stop-color:#7AA33C"/><stop  offset="1" style="stop-color:#36874D"/></linearGradient><polygon fill="url(#SVGID_7_)" points="57.258,58.274 58.441,55.248 71.492,60.351 70.309,63.377 "/><path fill="#316E4F" d="M58.653,55.734l12.353,4.829l-0.91,2.327l-12.353-4.829L58.653,55.734 M58.228,54.763l-1.456,3.725l13.75,5.375l1.456-3.725L58.228,54.763L58.228,54.763z"/></g></g><g><g><linearGradient id="SVGID_8_" gradientUnits="userSpaceOnUse" x1="54.9131" y1="63.7393" x2="67.0851" y2="71.3848"><stop  offset="0" style="stop-color:#7AA33C"/><stop  offset="1" style="stop-color:#36874D"/></linearGradient><polygon fill="url(#SVGID_8_)" points="53.883,66.524 55.066,63.498 68.117,68.601 66.934,71.627 "/><path fill="#316E4F" d="M55.278,63.984l12.353,4.829l-0.91,2.327l-12.353-4.829L55.278,63.984 M54.853,63.013l-1.456,3.725l13.75,5.375l1.456-3.725L54.853,63.013L54.853,63.013z"/></g></g><g><g><linearGradient id="SVGID_9_" gradientUnits="userSpaceOnUse" x1="51.3516" y1="72.0527" x2="63.5236" y2="79.6983"><stop  offset="0" style="stop-color:#7AA33C"/><stop  offset="1" style="stop-color:#36874D"/></linearGradient><polygon fill="url(#SVGID_9_)" points="50.32,74.837 51.503,71.811 64.555,76.913 63.372,79.939 "/><path fill="#316E4F" d="M51.716,72.297l12.353,4.829l-0.91,2.327l-12.353-4.829L51.716,72.297 M51.291,71.325l-1.456,3.725l13.75,5.375l1.456-3.725L51.291,71.325L51.291,71.325z"/></g></g><g><g><linearGradient id="SVGID_10_" gradientUnits="userSpaceOnUse" x1="44.0391" y1="41.1768" x2="56.2111" y2="48.8223"><stop  offset="0" style="stop-color:#7AA33C"/><stop  offset="1" style="stop-color:#36874D"/></linearGradient><polygon fill="url(#SVGID_10_)" points="43.008,43.962 44.191,40.936 57.242,46.038 56.059,49.064 "/><path fill="#316E4F" d="M44.403,41.422l12.353,4.829l-0.91,2.327l-12.353-4.829L44.403,41.422 M43.978,40.45l-1.456,3.725l13.75,5.375l1.456-3.725L43.978,40.45L43.978,40.45z"/></g></g><g><g><linearGradient id="SVGID_11_" gradientUnits="userSpaceOnUse" x1="41.0391" y1="49.1768" x2="53.2111" y2="56.8223"><stop  offset="0" style="stop-color:#7AA33C"/><stop  offset="1" style="stop-color:#36874D"/></linearGradient><polygon fill="url(#SVGID_11_)" points="40.008,51.962 41.191,48.936 54.242,54.038 53.059,57.064 "/><path fill="#316E4F" d="M41.403,49.422l12.353,4.829l-0.91,2.327l-12.353-4.829L41.403,49.422 M40.978,48.45l-1.456,3.725l13.75,5.375l1.456-3.725L40.978,48.45L40.978,48.45z"/></g></g><g><g><linearGradient id="SVGID_12_" gradientUnits="userSpaceOnUse" x1="37.6641" y1="57.4268" x2="49.8361" y2="65.0723"><stop  offset="0" style="stop-color:#7AA33C"/><stop  offset="1" style="stop-color:#36874D"/></linearGradient><polygon fill="url(#SVGID_12_)" points="36.633,60.212 37.816,57.186 50.867,62.288 49.684,65.314 "/><path fill="#316E4F" d="M38.028,57.672l12.353,4.829l-0.91,2.327l-12.353-4.829L38.028,57.672 M37.603,56.7l-1.456,3.725l13.75,5.375l1.456-3.725L37.603,56.7L37.603,56.7z"/></g></g><g><g><linearGradient id="SVGID_13_" gradientUnits="userSpaceOnUse" x1="34.1006" y1="65.7393" x2="46.2726" y2="73.3848"><stop  offset="0" style="stop-color:#7AA33C"/><stop  offset="1" style="stop-color:#36874D"/></linearGradient><polygon fill="url(#SVGID_13_)" points="33.07,68.524 34.253,65.498 47.305,70.601 46.122,73.627 "/><path fill="#316E4F" d="M34.466,65.984l12.353,4.829l-0.91,2.327l-12.353-4.829L34.466,65.984 M34.041,65.013l-1.456,3.725l13.75,5.375l1.456-3.725L34.041,65.013L34.041,65.013z"/></g></g><g><g><linearGradient id="SVGID_14_" gradientUnits="userSpaceOnUse" x1="30.7266" y1="74.3027" x2="42.8977" y2="81.9478"><stop  offset="0" style="stop-color:#7AA33C"/><stop  offset="1" style="stop-color:#36874D"/></linearGradient><polygon fill="url(#SVGID_14_)" points="29.695,77.087 30.878,74.061 43.93,79.163 42.747,82.189 "/><path fill="#316E4F" d="M31.091,74.547l12.353,4.829l-0.91,2.327l-12.353-4.829L31.091,74.547 M30.666,73.575L29.209,77.3l13.75,5.375l1.456-3.725L30.666,73.575L30.666,73.575z"/></g></g><g><g><linearGradient id="SVGID_15_" gradientUnits="userSpaceOnUse" x1="27.2256" y1="34.6768" x2="39.3976" y2="42.3223"><stop  offset="0" style="stop-color:#7AA33C"/><stop  offset="1" style="stop-color:#36874D"/></linearGradient><polygon fill="url(#SVGID_15_)" points="26.195,37.462 27.378,34.436 40.43,39.538 39.247,42.564 "/><path fill="#316E4F" d="M27.591,34.922l12.353,4.829l-0.91,2.327l-12.353-4.829L27.591,34.922 M27.166,33.95l-1.456,3.725l13.75,5.375l1.456-3.725L27.166,33.95L27.166,33.95z"/></g></g><g><g><linearGradient id="SVGID_16_" gradientUnits="userSpaceOnUse" x1="24.2261" y1="42.6768" x2="36.3972" y2="50.3218"><stop  offset="0" style="stop-color:#7AA33C"/><stop  offset="1" style="stop-color:#36874D"/></linearGradient><polygon fill="url(#SVGID_16_)" points="23.195,45.462 24.378,42.436 37.43,47.538 36.247,50.564 "/><path fill="#316E4F" d="M24.591,42.922l12.353,4.829l-0.91,2.327l-12.353-4.829L24.591,42.922 M24.166,41.95l-1.456,3.725l13.75,5.375l1.456-3.725L24.166,41.95L24.166,41.95z"/></g></g><g><g><linearGradient id="SVGID_17_" gradientUnits="userSpaceOnUse" x1="20.8506" y1="50.9268" x2="33.0226" y2="58.5723"><stop  offset="0" style="stop-color:#7AA33C"/><stop  offset="1" style="stop-color:#36874D"/></linearGradient><polygon fill="url(#SVGID_17_)" points="19.82,53.712 21.003,50.686 34.055,55.788 32.872,58.814 "/><path fill="#316E4F" d="M21.216,51.172l12.353,4.829l-0.91,2.327l-12.353-4.829L21.216,51.172 M20.791,50.2l-1.456,3.725l13.75,5.375l1.456-3.725L20.791,50.2L20.791,50.2z"/></g></g><g><g><linearGradient id="SVGID_18_" gradientUnits="userSpaceOnUse" x1="17.2891" y1="59.2402" x2="29.4602" y2="66.8853"><stop  offset="0" style="stop-color:#7AA33C"/><stop  offset="1" style="stop-color:#36874D"/></linearGradient><polygon fill="url(#SVGID_18_)" points="16.258,62.024 17.441,58.998 30.492,64.101 29.309,67.127 "/><path fill="#316E4F" d="M17.653,59.484l12.353,4.829l-0.91,2.327l-12.353-4.829L17.653,59.484 M17.228,58.513l-1.456,3.725l13.75,5.375l1.456-3.725L17.228,58.513L17.228,58.513z"/></g></g><g><g><linearGradient id="SVGID_19_" gradientUnits="userSpaceOnUse" x1="13.9131" y1="67.8018" x2="26.0859" y2="75.4479"><stop  offset="0" style="stop-color:#7AA33C"/><stop  offset="1" style="stop-color:#36874D"/></linearGradient><polygon fill="url(#SVGID_19_)" points="12.883,70.587 14.066,67.561 27.117,72.663 25.934,75.689 "/><path fill="#316E4F" d="M14.278,68.047l12.353,4.829l-0.91,2.327l-12.353-4.829L14.278,68.047 M13.853,67.075L12.397,70.8l13.75,5.375l1.456-3.725L13.853,67.075L13.853,67.075z"/></g></g><linearGradient id="SVGID_20_" gradientUnits="userSpaceOnUse" x1="16.2876" y1="55.4629" x2="93.9206" y2="84.8787"><stop  offset="0.1394" style="stop-color:#FFFFFF"/><stop  offset="0.3576" style="stop-color:#F6FCF4;stop-opacity:0.7907"/><stop  offset="0.6606" style="stop-color:#D4F2CB;stop-opacity:0"/></linearGradient><polygon fill="url(#SVGID_20_)" points="22.75,25.046 84.137,47.37 64.065,106.176 1.012,83.477 "/></g></g></g><g id="microsoftExcelSvg"><radialGradient id="SVGID_21_" cx="52.6709" cy="59.3203" r="23.1853" gradientTransform="matrix(-1 0 0 1 61.5859 0)" gradientUnits="userSpaceOnUse"><stop  offset="0.4485" style="stop-color:#99CC4B"/><stop  offset="1" style="stop-color:#316E4F"/></radialGradient><polygon fill="url(#SVGID_21_)" stroke="#226F37" stroke-width="0.25" points="49.625,13.375 23.891,51.484 30.391,51.484 30.375,59.042 7.959,59.042 38.125,13.375 "/><g><radialGradient id="SVGID_22_" cx="30.0532" cy="34.3311" r="27.7618" gradientUnits="userSpaceOnUse"><stop  offset="0.4485" style="stop-color:#99CC4B"/><stop  offset="1" style="stop-color:#316E4F"/></radialGradient><polygon fill="url(#SVGID_22_)" points="40.691,58.917 10.193,13.5 21.391,13.5 51.393,58.917 "/><path fill="#226F37" d="M21.324,13.625L51.16,58.792H40.758L10.428,13.625H21.324 M21.458,13.375h-11.5l30.667,45.667h11L21.458,13.375L21.458,13.375z"/></g></g></svg>';
		}
	}

	function innerHtml(info) {
		var innerHtml;
		var setInnerHtml = {
			dialog: dialog,
			gigInfoTableRow: gigInfoTableRow,
			dataList: dataList,
			gigGuide: gigGuide,
		};

		setInnerHtml[info.type]();

		return innerHtml;

		function dialog() {
			var setDialogInnerHtml = {
				invalidRequiredFields: invalidRequiredFields,
				gigInfoExists: gigInfoExists,
				gigInfoUpdated: gigInfoUpdated,
				gigInfoSaved: gigInfoSaved,
				gigInfoPublish: gigInfoPublish,
				gigInfoPublishWeb: gigInfoPublishWeb,
				noGigsForStartDate: noGigsForStartDate,
				horizontalDialog: horizontalDialog,
				excelExporter: excelExporter,
			};

			setDialogInnerHtml[info.dialog]();

			function invalidRequiredFields() {
				innerHtml = [
					"<article data-type = 'invalidRequiredFields'>",
						"<figure>",
							webPage.html.svg("attention"),
						"</figure>",
						"<p>Please fill in all the required fields.</p>",
						"<span>",
							"<input type = 'button' value = 'OK'>",
						"<span>",
					"</article>",
				].join("");
			}

			function gigInfoExists() {
				innerHtml = [
					"<article data-type = 'gigInfoExists'>",
						"<figure>",
							webPage.html.svg("attention"),
						"</figure>",
						"<p>The gig information you're trying to save already exists.</p>",
						"<span>",
							"<input type = 'button' value = 'OK'>",
						"<span>",
					"</article>",
				].join("");
			}

			function gigInfoUpdated() {
				innerHtml = [
					"<article data-type = 'gigInfoUpdated'>",
						"<figure>",
							webPage.html.svg("success"),
						"</figure>",
						"<p>The gig information has successfully been updated.</p>",
						"<span>",
							"<input type = 'button' value = 'OK'>",
						"<span>",
					"</article>",
				].join("");
			}

			function gigInfoSaved() {
				innerHtml = [
					"<article data-type = 'gigInfoSaved'>",
						"<figure>",
							webPage.html.svg("success"),
						"</figure>",
						"<p>The new gig information has successfully been saved.</p>",
						"<span>",
							"<input type = 'button' value = 'OK'>",
						"<span>",
					"</article>",
				].join("");
			}

			function gigInfoPublish() {
				innerHtml = [
					"<article data-type = 'gigInfoPublish'>",
						"<figure>",
							"<figure>",
								webPage.html.svg("chrome"),
							"</figure>",
							"<figure>",
								webPage.html.svg("excel"),
							"</figure>",
						"</figure>",
						"<span>",
							"<input type = 'button' value = 'Cancel'>",
						"</span>",
					"</article>",
				].join("");
			}

			function gigInfoPublishWeb() {
				innerHtml = [
					"<article data-type = 'gigInfoPublishWeb'>",
						"<figure>",
							webPage.html.svg("chrome"),
						"</figure>",
						"<section>",
							"<h1>",
								"Website Publisher",
							"</h1>",
							"<p>",
								"Please select a date from which to start publishing your gigs.",
							"</p>",
							"<input type = date value = '" + webPage.regex.isoDate.exec(new Date().toISOString())[0] + "'>",
							"<br>",
							"<span>",
								"<input type = 'button' value = 'Publish'>",
								"<input type = 'button' value = 'Cancel'>",
							"</span>",
						"</section>",
						"</article>",
				].join("");
			}

			function noGigsForStartDate() {
				innerHtml = [
					"<article data-type = 'noGigsForStartDate'>",
						"<figure>",
							webPage.html.svg("attention"),
						"</figure>",
						"<section>",
							"<p>",
								"There are no gigs on or following ", webPage.html.selection("gigInfoPublishDialogDateInput").value, ".", 
							"</p>",
							"<p>",
								"Please select an earlier date.",
							"</p>",
							"<span>",
								"<input type = 'button' value = 'OK'>",
							"</span>",
						"</section>",
						"</article>",
				].join("");
			}

			function horizontalDialog() {
				innerHtml = [
					"<ul data-type = 'horizontalDialog'>",
						"<li>",
							"<figure>",
								webPage.html.svg(info.svg),
							"</figure>",
						"</li>",
						"<li>",
							"<p>",
								info.message,
							"</p>",
						"</li>",
						"<li>",
							"<input type = 'button' value = '" + info.button + "'>",
						"</li>",
					"</ul>",
				].join("");
			}

			function excelExporter() {
				innerHtml = [
					"<table data-type = 'excelExporter'>",
						"<tbody>",
							"<tr>",
								"<td>",
									"<figure>",
										webPage.html.svg("excel"),
									"</figure>",
								"</td>",
								"<td>",
									"<h1>",
										"Excel Exporter",
									"</h1>",
									"<p>",
										"Please select the years from which to generate an annual report.",
									"</p>",
									"<ul>",
										getYearListItems(),
									"</ul>",
									"<span>",
										"<input type = 'button' value = 'Export'>",
										"<input type = 'button' value = 'Cancel'",
									"</span>",
								"</td>",
							"</tr>",
						"</tbody>",
					"</table>",
				].join("");

				function getYearListItems() {
					var listYearItems = "";

					$.each(info.gigYears, function (yearIndex, year) {
						listYearItems += [
							"<li>",
								"<figure data-selected = 'true'></figure>",
								"<span>",
									year,
								"</span>",
							"</li>",
						].join("");
					});

					return listYearItems;
				}
			}
		}

		function gigInfoTableRow() {
			setGigStatusReference();

			innerHtml = [
				"<tr data-gig-info = '", JSON.stringify(info.gig), "'>",
					"<td>",
						"<span>",
							getGigCount(),
						"</span>",
					"</td>",
					"<td data-status = '", getGigStatus(info.gig), "'>",
						"<figure></figure>",
					"</td>",
					"<td>",
						"<span>",
							info.gig.date.dayName,
						"</span>",
					"</td>",
					"<td>",
						"<span>",
							info.gig.date.day,
						"</span>",
					"</td>",
					"<td>",
						"<span>",
							info.gig.date.monthName,
						"</span>",
					"</td>",
					"<td>",
						"<span>",
							info.gig.date.year,
						"</span>",
					"</td>",
					"<td>",
						"<span>",
							[info.gig.start.hour, info.gig.start.minute].join(":"),
						"</span>",
					"</td>",
					"<td>",
						"<span>",
							[info.gig.end.hour, info.gig.end.minute].join(":"),
						"</span>",
					"</td>",
					"<td>",
						"<span>",
							info.gig.venue,
						"</span>",
					"</td>",
				"</tr>",
			].join("");

			function getGigStatus(gig) {
				var gigStatus;

				if (webPage.regex.False.test(gig.invoice.paid) && webPage.regex.False.test(gig.cancelled)) {
					gigStatus = "unpaid";
				} else if (webPage.regex.True.test(gig.invoice.paid) && webPage.regex.False.test(gig.cancelled)) {
					gigStatus = "paid";
				} else if (
					webPage.regex.True.test(gig.cancelled) ||
					webPage.regex.True.test(gig.cancelled) && webPage.regex.True.test(gig.invoice.paid) ||
					webPage.regex.True.test(gig.cancelled) && webPage.regex.True.test(gig.invoice.paid)
				) {
					gigStatus = "cancelled";
				}

				return gigStatus
			}

			function setGigStatusReference() {
				if (!webPage.html.getGigStatus) {
					webPage.html.getGigStatus = getGigStatus;
				}
			}

			function getGigCount() {
				var gigIndex;

				if (isNaN(info.gigIndex)) {
					gigIndex = "";
				} else {
					gigIndex = info.gigIndex + 1;
				}

				return gigIndex;
			}
		}

		function dataList() {
			var getOption = new function () {
				this.venues = this.references = standard;
				this.telephones = this.emails = labelled;
			};

			innerHtml = "";

			$.each(info.dataListOptions, function (optionIndex, option) {
				innerHtml += getOption[info.dataListName](option);
			});

			innerHtml = innerHtml.replace(webPage.regex.allGrouped, "<datalist>" + webPage.regex.replacementText.group1, "</datalist>");

			function standard(option) {
				var option = "<option value = '" + option + "'></option>";

				return option;
			}

			function labelled(option) {
				var option = "<option value = '" + option.value + "' label = '" + option.label + "'></option>";

				return option;
			}
		}

		function gigGuide() {
			innerHtml = "";

			$.each(info.gigsToPublish, function (gigInfoIndex, gigInfo) {
				innerHtml += [
					"<tr>",
						"<td>",
							"<span>",
								webPage.html.data.unabbreviated({
									key: "day",
									gigInfo: gigInfo,
								}),
							"</span>",
						"</td>",
						"<td>",
							"<span>",
								gigInfo.date,
							"</span>",
						"</td>",
						"<td>",
							"<span>",
								webPage.html.data.unabbreviated({
									key: "month",
									gigInfo: gigInfo,
								}),
							"</span>",
						"</td>",
						"<td>",
							"<span>",
								gigInfo.start,
							"</span>",
						"</td>",
						"<td>",
							"<span>",
								gigInfo.end,
							"</span>",
						"</td>",
						"<td>",
							"<span>",
								gigInfo.venue,
							"</span>",
						"</td>",
					"</tr>",
				].join("");
			});

			innerHtml = innerHtml.replace(webPage.regex.allGrouped, [
				"<hgroup>",
					"<h1>",
						"Day",
					"</h1>",
					"<h1>",
						"Date",
					"</h1>",
					"<h1>",
						"Month",
					"</h1>",
					"<h1>",
						"Start",
					"</h1>",
					"<h1>",
						"End",
					"</h1>",
					"<h1>",
						"Venue",
					"</h1>",
				"</hgroup>",
				"<section>",
					"<table>",
						"<tbody>",
							webPage.regex.replacementText.group1,
						"</tbody>",
					"</table>",
				"</section>",
			].join(""));
		}
	}

	function getData() { // Variables containing or to store data
		var data = {
			dialogBox: getDialogBoxData(),
			unabbreviated: unabbreviated,
			excelFiles: null,
		};

		return data;

		function getDialogBoxData() {
			var dialogBoxData = {
				initialize: initialize,
				getCenteredPosition: getCenteredPosition,
			};

			return dialogBoxData;

			function initialize() {
				var dialogBoxArticle = webPage.html.selection("dialogBoxArticle");
				var initializeDialogInnerHtmlData = {
					invalidRequiredFields: invalidRequiredFields,
					gigInfoExists: gigInfoExists,
					gigInfoUpdated: gigInfoUpdated,
					gigInfoSaved: gigInfoSaved,
					gigInfoPublish: gigInfoPublish,
					gigInfoPublishWeb: gigInfoPublishWeb,
					noGigsForStartDate: noGigsForStartDate,
				};

				if (!("padding" in webPage.html.data.dialogBox)) {
					webPage.html.data.dialogBox.padding = getPadding();
					webPage.html.data.dialogBox.position = getPosition();
				}

				initializeDialogInnerHtmlData[dialogBoxArticle.dataset.type]();

				function getPadding() {
					var padding;

					webPage.updateUi({
						type: "metricElement",
						modify: "square",
						width: "0.5em",
					});

					return webPage.html.selection("metricElement").offsetWidth;
				}

				function getPosition() {
					var position = {
						center: {
							left: document.body.offsetWidth / 2,
							top: document.body.offsetHeight / 2,
						},
					};

					return position;
				}

				function invalidRequiredFields() {
					if (!("invalidRequiredFields" in webPage.html.data.dialogBox)) {
						webPage.html.data.dialogBox.invalidRequiredFields = new function () {
							var currentData = this;
							var invalidRequiredFieldsDialogAttentionFigure = webPage.html.selection("invalidRequiredFieldsDialogAttentionFigure");
							var invalidRequiredFieldsDialogAttentionSvg = webPage.html.selection("invalidRequiredFieldsDialogAttentionSvg");
							var invalidRequiredFieldsDialogMessage = webPage.html.selection("invalidRequiredFieldsDialogMessage");
							var invalidRequiredFieldsDialogButtonBox = webPage.html.selection("invalidRequiredFieldsDialogButtonBox");
							var largestChildWidth = getLargestChildWidth();

							this.position = new function () {
								this.center = {
									left: (largestChildWidth + (webPage.html.data.dialogBox.padding * 2)) / 2,
								};
							};

							this.figure = new function () {
								this.position = {
									left: getCenteredPosition(currentData.position.center.left, invalidRequiredFieldsDialogAttentionFigure, "left"),
									top: webPage.html.data.dialogBox.padding,
								};
							};

							this.message = new function () {
								this.position = {
									left: getCenteredPosition(currentData.position.center.left, invalidRequiredFieldsDialogMessage, "left"),
									top: currentData.figure.position.top + invalidRequiredFieldsDialogAttentionSvg.offsetHeight + webPage.html.data.dialogBox.padding,
								};
							};

							this.buttons = new function () {
								this.position = {
									left: getCenteredPosition(currentData.position.center.left, invalidRequiredFieldsDialogButtonBox, "left"),
									top: currentData.message.position.top + invalidRequiredFieldsDialogMessage.offsetHeight + webPage.html.data.dialogBox.padding,
								};
							};

							this.dialog = new function () {
								var dialogData = this;

								this.size = {
									width: largestChildWidth + (webPage.html.data.dialogBox.padding * 2),
									height: currentData.buttons.position.top + invalidRequiredFieldsDialogButtonBox.offsetHeight + (webPage.html.data.dialogBox.padding * 1.5),
								};

								this.position = {
									left: getCenteredPosition(webPage.html.data.dialogBox.position.center.left, dialogData.size.width, "left"),
									top: getCenteredPosition(webPage.html.data.dialogBox.position.center.top, dialogData.size.height, "top"),
								}
							};
						};
					}
				}

				function gigInfoExists() {
					if (!("gigInfoExists" in webPage.html.data.dialogBox)) {
						webPage.html.data.dialogBox.gigInfoExists = new function () {
							var currentData = this;
							var gigInfoExistsDialogAttentionFigure = webPage.html.selection("gigInfoExistsDialogAttentionFigure");
							var gigInfoExistsDialogAttentionSvg = webPage.html.selection("gigInfoExistsDialogAttentionSvg");
							var gigInfoExistsDialogMessage = webPage.html.selection("gigInfoExistsDialogMessage");
							var gigInfoExistsDialogButtonBox = webPage.html.selection("gigInfoExistsDialogButtonBox");
							var largestChildWidth = getLargestChildWidth();

							this.position = new function () {
								this.center = {
									left: (largestChildWidth + (webPage.html.data.dialogBox.padding * 2)) / 2,
								};
							};

							this.figure = new function () {
								this.position = {
									left: getCenteredPosition(currentData.position.center.left, gigInfoExistsDialogAttentionFigure, "left"),
									top: webPage.html.data.dialogBox.padding,
								};
							};

							this.message = new function () {
								this.position = {
									left: getCenteredPosition(currentData.position.center.left, gigInfoExistsDialogMessage, "left"),
									top: currentData.figure.position.top + gigInfoExistsDialogAttentionSvg.offsetHeight + webPage.html.data.dialogBox.padding,
								};
							};

							this.buttons = new function () {
								this.position = {
									left: getCenteredPosition(currentData.position.center.left, gigInfoExistsDialogButtonBox, "left"),
									top: currentData.message.position.top + gigInfoExistsDialogMessage.offsetHeight + webPage.html.data.dialogBox.padding,
								};
							};

							this.dialog = new function () {
								var dialogData = this;

								this.size = {
									width: largestChildWidth + (webPage.html.data.dialogBox.padding * 2),
									height: currentData.buttons.position.top + gigInfoExistsDialogButtonBox.offsetHeight + (webPage.html.data.dialogBox.padding * 1.5),
								};

								this.position = {
									left: getCenteredPosition(webPage.html.data.dialogBox.position.center.left, dialogData.size.width, "left"),
									top: getCenteredPosition(webPage.html.data.dialogBox.position.center.top, dialogData.size.height, "top"),
								}
							};
						};
					}
				}

				function gigInfoUpdated() {
					if (!("gigInfoUpdated" in webPage.html.data.dialogBox)) {
						webPage.html.data.dialogBox.gigInfoUpdated = new function () {
							var currentData = this;
							var gigInfoUpdatedDialogSuccessFigure = webPage.html.selection("gigInfoUpdatedDialogSuccessFigure");
							var gigInfoUpdatedDialogAttentionSvg = webPage.html.selection("gigInfoUpdatedDialogAttentionSvg");
							var gigInfoUpdatedDialogMessage = webPage.html.selection("gigInfoUpdatedDialogMessage");
							var gigInfoUpdatedDialogButtonBox = webPage.html.selection("gigInfoUpdatedDialogButtonBox");
							var largestChildWidth = getLargestChildWidth();

							this.position = new function () {
								this.center = {
									left: (largestChildWidth + (webPage.html.data.dialogBox.padding * 2)) / 2,
								};
							};

							this.figure = new function () {
								this.position = {
									left: getCenteredPosition(currentData.position.center.left, gigInfoUpdatedDialogSuccessFigure, "left"),
									top: webPage.html.data.dialogBox.padding,
								};
							};

							this.message = new function () {
								this.position = {
									left: getCenteredPosition(currentData.position.center.left, gigInfoUpdatedDialogMessage, "left"),
									top: currentData.figure.position.top + gigInfoUpdatedDialogAttentionSvg.offsetHeight + webPage.html.data.dialogBox.padding,
								};
							};

							this.buttons = new function () {
								this.position = {
									left: getCenteredPosition(currentData.position.center.left, gigInfoUpdatedDialogButtonBox, "left"),
									top: currentData.message.position.top + gigInfoUpdatedDialogMessage.offsetHeight + webPage.html.data.dialogBox.padding,
								};
							};

							this.dialog = new function () {
								var dialogData = this;

								this.size = {
									width: largestChildWidth + (webPage.html.data.dialogBox.padding * 2),
									height: currentData.buttons.position.top + gigInfoUpdatedDialogButtonBox.offsetHeight + (webPage.html.data.dialogBox.padding * 1.5),
								};

								this.position = {
									left: getCenteredPosition(webPage.html.data.dialogBox.position.center.left, dialogData.size.width, "left"),
									top: getCenteredPosition(webPage.html.data.dialogBox.position.center.top, dialogData.size.height, "top"),
								}
							};
						};
					}
				}

				function gigInfoSaved() {
					if (!("gigInfoSaved" in webPage.html.data.dialogBox)) {
						webPage.html.data.dialogBox.gigInfoSaved = new function () {
							var currentData = this;
							var gigInfoSavedDialogSuccessFigure = webPage.html.selection("gigInfoSavedDialogSuccessFigure");
							var gigInfoSavedDialogAttentionSvg = webPage.html.selection("gigInfoSavedDialogAttentionSvg");
							var gigInfoSavedDialogMessage = webPage.html.selection("gigInfoSavedDialogMessage");
							var gigInfoSavedDialogButtonBox = webPage.html.selection("gigInfoSavedDialogButtonBox");
							var largestChildWidth = getLargestChildWidth();

							this.position = new function () {
								this.center = {
									left: (largestChildWidth + (webPage.html.data.dialogBox.padding * 2)) / 2,
								};
							};

							this.figure = new function () {
								this.position = {
									left: getCenteredPosition(currentData.position.center.left, gigInfoSavedDialogSuccessFigure, "left"),
									top: webPage.html.data.dialogBox.padding,
								};
							};

							this.message = new function () {
								this.position = {
									left: getCenteredPosition(currentData.position.center.left, gigInfoSavedDialogMessage, "left"),
									top: currentData.figure.position.top + gigInfoSavedDialogAttentionSvg.offsetHeight + webPage.html.data.dialogBox.padding,
								};
							};

							this.buttons = new function () {
								this.position = {
									left: getCenteredPosition(currentData.position.center.left, gigInfoSavedDialogButtonBox, "left"),
									top: currentData.message.position.top + gigInfoSavedDialogMessage.offsetHeight + webPage.html.data.dialogBox.padding,
								};
							};

							this.dialog = new function () {
								var dialogData = this;

								this.size = {
									width: largestChildWidth + (webPage.html.data.dialogBox.padding * 2),
									height: currentData.buttons.position.top + gigInfoSavedDialogButtonBox.offsetHeight + webPage.html.data.dialogBox.padding,
								};

								this.position = {
									left: getCenteredPosition(webPage.html.data.dialogBox.position.center.left, dialogData.size.width, "left"),
									top: getCenteredPosition(webPage.html.data.dialogBox.position.center.top, dialogData.size.height, "top"),
								}
							};
						};
					}
				}

				function gigInfoPublish() {
					if (!("gigInfoPublish" in webPage.html.data.dialogBox)) {
						webPage.html.data.dialogBox.gigInfoPublish = new function () {
							var currentData = this;
							var gigInfoPublishdialogBoxFigure = webPage.html.selection("gigInfoPublishdialogBoxFigure");
							var gigInfoPublishDialogButtonBox = webPage.html.selection("gigInfoPublishDialogButtonBox");

							this.position = new function () {
								this.center = {
									left: gigInfoPublishdialogBoxFigure.offsetWidth / 2,
								};
							};

							this.buttons = new function () {
								this.position = {
									left: currentData.position.center.left - (gigInfoPublishDialogButtonBox.offsetWidth/2) + webPage.html.data.dialogBox.padding,
									top: gigInfoPublishdialogBoxFigure.offsetHeight + (webPage.html.data.dialogBox.padding * 2),
								};
							}

							this.dialog = new function () {
								var dialogData = this;

								this.size = {
									width: gigInfoPublishdialogBoxFigure.offsetWidth,
									height: currentData.buttons.position.top + gigInfoPublishDialogButtonBox.offsetHeight,
								};

								this.position = {
									left: getCenteredPosition(webPage.html.data.dialogBox.position.center.left, dialogData.size.width, "left"),
									top: getCenteredPosition(webPage.html.data.dialogBox.position.center.top, dialogData.size.height, "top"),
								}
							};
						};
					}
				}

				function gigInfoPublishWeb() {
					if (!("gigInfoPublishWeb" in webPage.html.data.dialogBox)) {
						webPage.html.data.dialogBox.gigInfoPublishWeb = new function () {
							var currentData = this;
							var gigInfoPublishWebdialogBoxFigure = webPage.html.selection("gigInfoPublishWebdialogBoxFigure");
							var gigInfoPublishWebDialogSection = webPage.html.selection("gigInfoPublishWebDialogSection");

							this.figure = new function () {
								this.size = {
									height: gigInfoPublishWebDialogSection.offsetHeight,
								};

								this.position = {
									left: webPage.html.data.dialogBox.padding,
									top: webPage.html.data.dialogBox.padding,
								};
							};

							this.section = new function () {
								this.position = {
									left: currentData.figure.position.left + gigInfoPublishWebDialogSection.offsetHeight + webPage.html.data.dialogBox.padding,
									top: webPage.html.data.dialogBox.padding,
								};
							};

							this.dialog = new function () {
								var dialogData = this;

								this.size = {
									width: currentData.section.position.left + gigInfoPublishWebDialogSection.offsetWidth + webPage.html.data.dialogBox.padding,
									height: currentData.section.position.top + gigInfoPublishWebDialogSection.offsetHeight + webPage.html.data.dialogBox.padding,
								};

								this.position = {
									left: getCenteredPosition(webPage.html.data.dialogBox.position.center.left, dialogData.size.width, "left"),
									top: getCenteredPosition(webPage.html.data.dialogBox.position.center.top, dialogData.size.height, "top"),
								}
							};
						};
					}
				}

				function noGigsForStartDate() {
					if (!("noGigsForStartDate" in webPage.html.data.dialogBox)) {
						webPage.html.data.dialogBox.noGigsForStartDate = new function () {
							var dialogBoxFigure = webPage.html.selection("dialogBoxFigure");
							var dialogBoxSection = webPage.html.selection("dialogBoxSection");

							this.figure = new function () {
								var factor = 1.13;

								this.size = {
									height: dialogBoxSection.offsetHeight * factor,
								};
							};
						}
					}
				}

				function getLargestChildWidth() {
					var largestChildWidth = 0;

					$.each(webPage.html.selection("dialogBoxArticle").childNodes, function (childNodeIndex, childNode) {
						if (childNode.offsetWidth > largestChildWidth) {
							largestChildWidth = childNode.offsetWidth;
						}
					});

					return largestChildWidth;
				}
			}

			function getCenteredPosition(referencePoint, target, position) {
				var centeredPosition;
				var setCenteredPosition = {
					left: left,
					top: top,
				};

				setCenteredPosition[position]();

				return centeredPosition;

				function left() {
					if (webPage.regex.domElement.test(target.constructor.name)) {
						centeredPosition = referencePoint - (target.offsetWidth / 2);
					} else if (webPage.regex.Number.test(target.constructor.name)) {
						setCenterPointWithNumber();
					}
				}

				function top() {
					if (webPage.regex.domElement.test(target.constructor.name)) {
						centeredPosition = referencePoint - (target.offsetHeight / 2);
					} else if (webPage.regex.Number.test(target.constructor.name)) {
						setCenterPointWithNumber();
					}
				}

				function setCenterPointWithNumber() {
					centeredPosition = referencePoint - (target / 2);
				}
			}
		}

		function unabbreviated(info) {
			var unabbreviatedValue;
			var unabbreviateValue = {
				day: day,
				month: month,
			};

			return unabbreviateValue[info.key]()

			function day() {
				var unabbreviateDays = {
					"Mon": "Monday",
					"Tue": "Tuesday",
					"Wed": "Wednesday",
					"Thu": "Thursday",
					"Fri": "Friday",
					"Sat": "Saturday",
					"Sun": "Sunday",
				};

				return unabbreviateDays[info.gigInfo.day];
			}

			function month() {
				var unabbreviateDays = {
					"Jan": "January",
					"Feb": "February",
					"Mar": "March",
					"Apr": "April",
					"May": "May",
					"Jun": "June",
					"Jul": "July",
					"Aug": "August",
					"Sep": "September",
					"Oct": "October",
					"Nov": "November",
					"Dec": "December",
				};

				return unabbreviateDays[info.gigInfo.month];
			}
		}
	}

	function getSelection(selectionName) {
		var selection;
		var setSelection = {
			allCells: allCells,
			allRows: allRows,
			allVisibleRows: allVisibleRows,
			allInvisibleRows: allInvisibleRows,

			visibleHeaderMenu: visibleHeaderMenu,

			countColumnHeader: countColumnHeader,
			firstCountColumnSpans: firstCountColumnSpans,
			visibleGigCountSpans: visibleGigCountSpans,

			statusColumnHeader: statusColumnHeader,
			firstPaidGig: firstPaidGig,
			firstUnpaidGig: firstUnpaidGig,
			firstCancelledGig: firstCancelledGig,
			allStatusCells: allStatusCells,
			allVisibleStatusCells: allVisibleStatusCells,
			allInVisibleStatusCells: allInVisibleStatusCells,
			representativeGigStatusText: representativeGigStatusText,
			selectableStatusMenuOptions: selectableStatusMenuOptions,

			dayColumnHeader: dayColumnHeader,
			firstGigDaySpan: firstGigDaySpan,
			allDayCells: allDayCells,
			allVisibleDayCells: allVisibleDayCells,
			allInVisibleDayCells: allInVisibleDayCells,
			selectableDayMenuOptions: selectableDayMenuOptions,
			representativeGigDayText: representativeGigDayText,

			dateColumnHeader: dateColumnHeader,

			monthColumnHeader: monthColumnHeader,
			allMonthCells: allMonthCells,
			allVisibleMonthCells: allVisibleMonthCells,
			allInVisibleMonthCells: allInVisibleMonthCells,
			selectableMonthMenuOptions: selectableMonthMenuOptions,
			representativeGigMonthText: representativeGigMonthText,

			yearColumnHeader: yearColumnHeader,
			allYearCells: allYearCells,
			currentYearMenuOption: currentYearMenuOption,

			startColumnHeader: startColumnHeader,

			endColumnHeader: endColumnHeader,

			venueColumnHeader: venueColumnHeader,

			gigInfoSection: gigInfoSection,
			gigInfoTable: gigInfoTable,
			gigInfoTableBody: gigInfoTableBody,
			lastGigRow: lastGigRow,

			navigation: navigation,

			toggleableMenuOptions: toggleableMenuOptions,
			currentMenuToggleOnOptions: currentMenuToggleOnOptions,
			statusMenuOptions: statusMenuOptions,
			dayMenuOptions: dayMenuOptions,
			monthMenuOptions: monthMenuOptions,

			gigViewerForm: gigViewerForm,
			gigViewerTableInputs: gigViewerTableInputs,

			gigViewerNotesInput: gigViewerNotesInput,
			gigVenueInput: gigVenueInput,
			gigDateInput: gigDateInput,
			gigStartTimeInput: gigStartTimeInput,
			gigEndTimeInput: gigEndTimeInput,
			gigInvoiceInput: gigInvoiceInput,
			gigStatusInput: gigStatusInput,
			gigReferenceNameInput: gigReferenceNameInput,
			gigReferenceEmailInput: gigReferenceEmailInput,
			gigReferenceTelephoneInput: gigReferenceTelephoneInput,

			venueList: venueList,
			referenceList: referenceList,
			emailList: emailList,
			telephoneList: telephoneList,

			gigViewerCloseButton: gigViewerCloseButton,
			gigViewerNewButton: gigViewerNewButton,
			gigViewerSaveButton: gigViewerSaveButton,
			gigViewerPublishButton: gigViewerPublishButton,

			requiredLabels: requiredLabels,
			currentRequiredFieldLabel: currentRequiredFieldLabel,

			dialogBoxArticle: dialogBoxArticle,
			horzontalDialogBox: horzontalDialogBox,

			dialogBoxFigure: dialogBoxFigure,
			invalidRequiredFieldsDialogAttentionFigure: invalidRequiredFieldsDialogAttentionFigure,
			gigInfoExistsDialogAttentionFigure: gigInfoExistsDialogAttentionFigure,
			gigInfoUpdatedDialogSuccessFigure: gigInfoUpdatedDialogSuccessFigure,
			gigInfoSavedDialogSuccessFigure: gigInfoSavedDialogSuccessFigure,
			gigInfoPublishdialogBoxFigure: gigInfoPublishdialogBoxFigure,
			gigInfoPublishDialogWebFigure: gigInfoPublishDialogWebFigure,
			gigInfoPublishDialogExcelFigure: gigInfoPublishDialogExcelFigure,
			gigInfoPublishWebdialogBoxFigure: gigInfoPublishWebdialogBoxFigure,

			invalidRequiredFieldsDialogAttentionSvg: invalidRequiredFieldsDialogAttentionSvg,
			gigInfoExistsDialogAttentionSvg: gigInfoExistsDialogAttentionSvg,
			gigInfoUpdatedDialogAttentionSvg: gigInfoUpdatedDialogAttentionSvg,
			gigInfoSavedDialogAttentionSvg: gigInfoSavedDialogAttentionSvg,
			gigInfoPublishDialogWebSvg: gigInfoPublishDialogWebSvg,
			gigInfoPublishDialogExcelSvg: gigInfoPublishDialogExcelSvg,

			invalidRequiredFieldsDialogMessage: invalidRequiredFieldsDialogMessage,
			gigInfoExistsDialogMessage: gigInfoExistsDialogMessage,
			gigInfoUpdatedDialogMessage: gigInfoUpdatedDialogMessage,
			gigInfoSavedDialogMessage: gigInfoSavedDialogMessage,

			invalidRequiredFieldsDialogButtonBox: invalidRequiredFieldsDialogButtonBox,
			gigInfoExistsDialogButtonBox: gigInfoExistsDialogButtonBox,
			gigInfoUpdatedDialogButtonBox: gigInfoUpdatedDialogButtonBox,
			gigInfoSavedDialogButtonBox: gigInfoSavedDialogButtonBox,
			gigInfoPublishDialogButtonBox: gigInfoPublishDialogButtonBox,

			dialogBoxButton: dialogBoxButton,

			invalidRequiredFieldsDialogOkButton: invalidRequiredFieldsDialogOkButton,
			gigInfoExistsDialogOkButton: gigInfoExistsDialogOkButton,
			gigInfoUpdatedDialogOkButton: gigInfoUpdatedDialogOkButton,
			gigInfoSavedDialogOkButton: gigInfoSavedDialogOkButton,
			gigInfoPublishWebDialogPublishButton: gigInfoPublishWebDialogPublishButton,
			gigInfoPublishWebDialogCancelButton: gigInfoPublishWebDialogCancelButton,
			gigInfoPublishDialogCancelButton: gigInfoPublishDialogCancelButton,
			excelExporterCancelButton: excelExporterCancelButton,
			excelExporterExportButton: excelExporterExportButton,

			gigInfoPublishDialogDateInput: gigInfoPublishDialogDateInput,

			dialogBoxSection: dialogBoxSection,
			gigInfoPublishWebDialogSection: gigInfoPublishWebDialogSection,

			excelExporterYears: excelExporterYears,
			excelExporterYearsSelected: excelExporterYearsSelected,
			excelExporterYearsSelectedText: excelExporterYearsSelectedText,

			metricElement: metricElement,
		};

		setSelection[selectionName]();

		return selection;

		function allCells() {
			selection = webPage.html.body.$gigInfoTableSection[0].querySelectorAll(":scope > table > tbody > tr > td");
		}

		function allRows() {
			selection = webPage.html.body.$gigInfoTableSection[0].querySelectorAll(":scope > table > tbody > tr");
		}

		function allVisibleRows() {
			selection = [];
			allRows = $(
				webPage.html.body.$gigInfoTableSection[0].querySelectorAll(":scope > table > tbody > tr")
			).filter(function () {
				if (webPage.regex.nothing.test(this.style.display)) {
					selection.push(this);
				}
			});
		}

		function allInvisibleRows() {
			selection = [];
			allRows = $(
				webPage.html.body.$gigInfoTableSection[0].querySelectorAll(":scope > table > tbody > tr")
			).filter(function () {
				if (!webPage.regex.nothing.test(this.style.display)) {
					selection.push(this);
				}
			});
		}

		function visibleHeaderMenu() {
			var visibleMenu;

			findVisibleHeaderMenu();
			setSelection();

			function findVisibleHeaderMenu() {
				visibleMenu = $(webPage.html.body.$navigation[0].querySelectorAll(":scope > ul[data-menu]")).filter(function () {
					if (webPage.regex.visible.test(this.style.visibility)) {
						return this;
					}
				});
			}

			function setSelection() {
				if (visibleMenu.length > 0) {
					selection = visibleMenu[0];
				} else {
					selection = null;
				}
			}
		}

		function countColumnHeader() {
			selection = document.querySelector("body > nav:nth-of-type(1) > span:nth-of-type(1)");
		}

		function firstCountColumnSpans() {
			selection = document.querySelectorAll("body > section:nth-of-type(1) > table > tbody > tr > td:first-of-type > span");
		}

		function visibleGigCountSpans() {
			var gigInfoRow;

			firstCountColumnSpans(); // Set selection to all gig counts

			selection = $(selection).filter(function () {
				gigInfoRow = this.parentNode.parentNode;

				if (webPage.regex.nothing.test(gigInfoRow.style.display)) {
					return this;
				}
			});
		}

		function representativeGigStatusText() {
			var gigInfoRow;
			var gigStatusText;
			var gigStatusTextList = [];
			var gigStatusTextListIndex;

			visibleGigCountSpans() // Set selection to all visible gig count spans

			$(selection).filter(function () {
				gigInfoRow = this.parentNode.parentNode;
				gigStatusText = gigInfoRow.childNodes[1].dataset.status[0].toUpperCase() + gigInfoRow.childNodes[1].dataset.status.slice(1); // Capitalize first letter to match menu options
				gigStatusTextListIndex = gigStatusTextList.indexOf(gigStatusText);

				if (gigStatusTextListIndex === -1) {
					gigStatusTextList.push(gigStatusText);
				}
			});

			selection = gigStatusTextList;
		}

		function selectableStatusMenuOptions() {
			selection = webPage.html.body.$statusMenu[0].querySelectorAll(":scope > li[data-selectable=true]");
		}

		function statusColumnHeader() {
			selection = document.querySelector("body > nav:nth-of-type(1) > span:nth-of-type(2)");
		}

		function firstPaidGig() {
			selection = webPage.html.body.$gigInfoTableSection[0].querySelector(":scope > table > tbody > tr > td[data-status=paid");
		}

		function firstUnpaidGig() {
			selection = webPage.html.body.$gigInfoTableSection[0].querySelector(":scope > table > tbody > tr > td[data-status=unpaid");
		}

		function firstCancelledGig() {
			selection = webPage.html.body.$gigInfoTableSection[0].querySelector(":scope > table > tbody > tr > td[data-status=cancelled");
		}

		function allStatusCells() {
			selection = document.querySelectorAll("body > section:nth-of-type(1) > table > tbody > tr > td:nth-of-type(2)");
		}

		function allVisibleStatusCells() {
			var visibleStatusCells = []

			allVisibleRows() // Set selection to all visible rows

			$(selection).filter(function (visibleRowIndex, visibleRow) {
				visibleStatusCells.push(this.childNodes[1]);
			});

			selection = visibleStatusCells;
		}

		function allInVisibleStatusCells() {
			var invisibleStatusCells = []

			allInvisibleRows() // Set selection to all visible rows

			$(selection).filter(function (visibleRowIndex, visibleRow) {
				invisibleStatusCells.push(this.childNodes[1]);
			});

			selection = invisibleStatusCells;
		}

		function dayColumnHeader() {
			selection = document.querySelector("body > nav:nth-of-type(1) > span:nth-of-type(3)");
		}

		function firstGigDaySpan() {
			selection = document.querySelector("body > section:nth-of-type(1) > table > tbody > tr > td:nth-of-type(3) > span");
		}

		function allDayCells() {
			selection = webPage.html.body.$gigInfoTableSection.find("table > tbody > tr > td:nth-of-type(3)");
		}

		function allVisibleDayCells() {
			var visibleDayCells = []

			allVisibleRows() // Set selection to all visible rows

			$(selection).filter(function (visibleRowIndex, visibleRow) {
				visibleDayCells.push(this.childNodes[2]);
			});

			selection = visibleDayCells;
		}

		function allInVisibleDayCells() {
			var invisibleDayCells = []

			allInvisibleRows() // Set selection to all visible rows

			$(selection).filter(function (visibleRowIndex, visibleRow) {
				invisibleDayCells.push(this.childNodes[2]);
			});

			selection = invisibleDayCells;
		}

		function selectableDayMenuOptions() {
			selection = webPage.html.body.$dayMenu[0].querySelectorAll(":scope > li[data-selectable=true]");
		}

		function representativeGigDayText() {
			var gigInfoRow;
			var gigDayText;
			var gigDayTextList = [];
			var gigDayTextListIndex;

			visibleGigCountSpans() // Set selection to all visible gig count spans

			$(selection).filter(function () {
				gigInfoRow = this.parentNode.parentNode;
				gigDayText = gigInfoRow.childNodes[2].innerText;
				gigDayTextListIndex = gigDayTextList.indexOf(gigDayText);

				if (gigDayTextListIndex === -1) {
					gigDayTextList.push(gigDayText);
				}
			});

			selection = gigDayTextList;
		}

		function dateColumnHeader() {
			selection = document.querySelector("body > nav:nth-of-type(1) > span:nth-of-type(4)");
		}

		function monthColumnHeader() {
			selection = document.querySelector("body > nav:nth-of-type(1) > span:nth-of-type(5)");
		}

		function allMonthCells() {
			selection = webPage.html.body.$gigInfoTableSection.find("table > tbody > tr > td:nth-of-type(5)");
		}

		function allVisibleMonthCells() {
			var visibleMonthCells = []

			allVisibleRows() // Set selection to all visible rows

			$(selection).filter(function (visibleRowIndex, visibleRow) {
				visibleMonthCells.push(this.childNodes[4]);
			});

			selection = visibleMonthCells;
		}

		function allInVisibleMonthCells() {
			var invisibleMonthCells = []

			allInvisibleRows() // Set selection to all visible rows

			$(selection).filter(function (visibleRowIndex, visibleRow) {
				invisibleMonthCells.push(this.childNodes[4]);
			});

			selection = invisibleMonthCells;
		}

		function selectableMonthMenuOptions() {
			selection = webPage.html.body.$monthMenu[0].querySelectorAll(":scope > li[data-selectable=true]");
		}

		function representativeGigMonthText() {
			var gigInfoRow;
			var gigMonthText;
			var gigMonthTextList = [];
			var gigMonthTextListIndex;

			visibleGigCountSpans() // Set selection to all visible gig count spans

			$(selection).filter(function () {
				gigInfoRow = this.parentNode.parentNode;
				gigMonthText = gigInfoRow.childNodes[4].innerText;
				gigMonthTextListIndex = gigMonthTextList.indexOf(gigMonthText);

				if (gigMonthTextListIndex === -1) {
					gigMonthTextList.push(gigMonthText);
				}
			});

			selection = gigMonthTextList;
		}

		function yearColumnHeader() {
			selection = document.querySelector("body > nav:nth-of-type(1) > span:nth-of-type(6)");
		}

		function allYearCells() {
			selection = webPage.html.body.$gigInfoTableSection.find("table > tbody > tr > td:nth-of-type(6)");
		}

		function currentYearMenuOption() {
			selection = webPage.html.body.$yearMenu[0].querySelector(":scope > li[data-toggle=on");
		}

		function startColumnHeader() {
			selection = document.querySelector("body > nav:nth-of-type(1) > span:nth-of-type(7)");
		}

		function endColumnHeader() {
			selection = document.querySelector("body > nav:nth-of-type(1) > span:nth-of-type(8)");
		}

		function venueColumnHeader() {
			selection = document.querySelector("body > nav:nth-of-type(1) > span:nth-of-type(9)");
		}

		function firstGigVenueCell() {
			selection = document.querySelector("body > section:nth-of-type(1) > table > tbody > tr > td:nth-of-type(9)");
		}

		function gigInfoSection() {
			selection = document.querySelector("body > section:nth-of-type(1)");
		}

		function gigInfoTable() {
			selection = document.querySelector("body > section:nth-of-type(1) > table");
		}

		function gigInfoTableBody() {
			selection = document.querySelector("body > section:nth-of-type(1) > table > tbody");
		}

		function lastGigRow() {
			selection = webPage.html.selection("gigInfoTableBody").lastChild;
		}

		function navigation() {
			selection = document.querySelector("body > nav:nth-of-type(1)");
		}

		function toggleableMenuOptions() {
			selection = document.querySelectorAll([
				"body > nav:nth-of-type(1) > ul:nth-of-type(1) > li[data-toggle]", // Status menu options
				"body > nav:nth-of-type(1) > ul > li[data-toggle]", // Day, month and year menu options
			].join(","));
		}

		function currentMenuToggleOnOptions() {
			selection = webPage.html.data.currentOptionMenu.querySelectorAll(":scope > li[data-toggle=on]");
		}

		function statusMenuOptions() {
			selection = webPage.html.body.$statusMenu[0].querySelectorAll("li");
		}

		function dayMenuOptions() {
			selection = webPage.html.body.$dayMenu[0].querySelectorAll("li");
		}

		function monthMenuOptions() {
			selection = webPage.html.body.$monthMenu[0].querySelectorAll("li");
		}

		function gigViewerForm() {
			selection = webPage.html.body.$gigViewerSection[0].querySelector(":scope > form");
		}

		function gigViewerNotesInput() {
			selection = webPage.html.body.$gigViewerSection[0].querySelector(":scope > form > textArea");
		}

		function gigViewerTableInputs() {
			selection = webPage.html.body.$gigViewerSection[0].querySelectorAll([
				":scope > form > table > tbody > tr > td:nth-of-type(2) > input",
				":scope > form > table > tbody > tr > td:nth-of-type(2) > select",
			].join(","));
		}

		function gigVenueInput() {
			selection = webPage.html.body.$gigViewerSection[0].querySelector(":scope > form > table > tbody > tr > td:nth-of-type(2) > input[name=venue]");
		}

		function gigDateInput() {
			selection = webPage.html.body.$gigViewerSection[0].querySelector(":scope > form > table > tbody > tr > td:nth-of-type(2) > input[name=date]");
		}

		function gigStartTimeInput() {
			selection = webPage.html.body.$gigViewerSection[0].querySelector(":scope > form > table > tbody > tr > td:nth-of-type(2) > input[name=startTime]");
		}

		function gigEndTimeInput() {
			selection = webPage.html.body.$gigViewerSection[0].querySelector(":scope > form > table > tbody > tr > td:nth-of-type(2) > input[name=endTime]");
		}

		function gigInvoiceInput() {
			selection = webPage.html.body.$gigViewerSection[0].querySelector(":scope > form > table > tbody > tr > td:nth-of-type(2) > input[name=invoice]");
		}

		function gigStatusInput() {
			selection = webPage.html.body.$gigViewerSection[0].querySelector(":scope > form > table > tbody > tr > td:nth-of-type(2) > select[name=status]");
		}

		function gigReferenceNameInput() {
			selection = webPage.html.body.$gigViewerSection[0].querySelector(":scope > form > table > tbody > tr > td:nth-of-type(2) > input[name=reference]");
		}

		function gigReferenceEmailInput() {
			selection = webPage.html.body.$gigViewerSection[0].querySelector(":scope > form > table > tbody > tr > td:nth-of-type(2) > input[name=email]");
		}

		function gigReferenceTelephoneInput() {
			selection = webPage.html.body.$gigViewerSection[0].querySelector(":scope > form > table > tbody > tr > td:nth-of-type(2) > input[name=telephone]");
		}

		function gigViewerCloseButton() {
			selection = webPage.html.body.$gigViewerSection[0].querySelector(":scope > form > input[name=close]");
		}

		function gigViewerNewButton() {
			selection = webPage.html.body.$gigViewerSection[0].querySelector(":scope > form > input[name=new]");
		}

		function gigViewerSaveButton() {
			selection = webPage.html.body.$gigViewerSection[0].querySelector(":scope > form > input[name=save]");
		}

		function gigViewerPublishButton() {
			selection = webPage.html.body.$gigViewerSection[0].querySelector(":scope > form > input[name=publish]");
		}

		function venueList() {
			selection = webPage.html.body.$gigViewerSection[0].querySelector("#venueList");
		}

		function referenceList() {
			selection = webPage.html.body.$gigViewerSection[0].querySelector("#referenceList");
		}

		function emailList() {
			selection = webPage.html.body.$gigViewerSection[0].querySelector("#emailList");
		}

		function telephoneList() {
			selection = webPage.html.body.$gigViewerSection[0].querySelector("#telephoneList");
		}

		function requiredLabels() {
			selection = webPage.html.body.$gigViewerSection[0].querySelectorAll([
				":scope > form > table > tbody > tr > td > label[for=venue]", /* Venu input label */
				":scope > form > table > tbody > tr > td > label[for=date]", /* Date input label */
				":scope > form > table > tbody > tr > td > label[for=startTime]", /* Start time input label */
				":scope > form > table > tbody > tr > td > label[for=endTime]" /* End time input label */
			].join(","));
		}

		function currentRequiredFieldLabel() {
			selection = webPage.html.body.$gigViewerSection[0].querySelector(":scope > form > table > tbody > tr > td > label[for=" + webPage.html.data.currentRequiredFieldLabel + "]");
		}

		function dialogBoxArticle() {
			selection = webPage.html.body.$dialogBox[0].querySelector(":scope > article");
		}

		function horzontalDialogBox() {
			selection = webPage.html.body.$dialogBox[0].querySelector(":scope > ul");
		}

		function dialogBoxFigure() {
			selection = webPage.html.body.$dialogBox[0].querySelector(":scope > article > figure");
		}

		function invalidRequiredFieldsDialogAttentionFigure() {
			selection = webPage.html.body.$dialogBox[0].querySelector(":scope > article[data-type=invalidRequiredFields] > figure");
		}

		function gigInfoExistsDialogAttentionFigure() {
			selection = webPage.html.body.$dialogBox[0].querySelector(":scope > article[data-type=gigInfoExists] > figure");
		}

		function gigInfoUpdatedDialogSuccessFigure() {
			selection = webPage.html.body.$dialogBox[0].querySelector(":scope > article[data-type=gigInfoUpdated] > figure");
		}

		function gigInfoSavedDialogSuccessFigure() {
			selection = webPage.html.body.$dialogBox[0].querySelector(":scope > article[data-type=gigInfoSaved] > figure");
		}

		function gigInfoPublishdialogBoxFigure() {
			selection = webPage.html.body.$dialogBox[0].querySelector(":scope > article[data-type=gigInfoPublish] > figure");
		}

		function gigInfoPublishDialogWebFigure() {
			selection = webPage.html.body.$dialogBox[0].querySelector(":scope > article[data-type=gigInfoPublish] > figure > figure:first-of-type");
		}

		function gigInfoPublishDialogExcelFigure() {
			selection = webPage.html.body.$dialogBox[0].querySelector(":scope > article[data-type=gigInfoPublish] > figure > figure:last-of-type");
		}

		function gigInfoPublishWebdialogBoxFigure() {
			selection = webPage.html.body.$dialogBox[0].querySelector(":scope > article[data-type=gigInfoPublishWeb] > figure");
		}

		function invalidRequiredFieldsDialogAttentionSvg() {
			selection = webPage.html.body.$dialogBox[0].querySelector(":scope > article[data-type=invalidRequiredFields] > figure > svg");
		}

		function gigInfoExistsDialogAttentionSvg() {
			selection = webPage.html.body.$dialogBox[0].querySelector(":scope > article[data-type=gigInfoExists] > figure > svg");
		}

		function gigInfoUpdatedDialogAttentionSvg() {
			selection = webPage.html.body.$dialogBox[0].querySelector(":scope > article[data-type=gigInfoUpdated] > figure > svg");
		}

		function gigInfoSavedDialogAttentionSvg() {
			selection = webPage.html.body.$dialogBox[0].querySelector(":scope > article[data-type=gigInfoSaved] > figure > svg");
		}

		function gigInfoPublishDialogWebSvg() {
			selection = webPage.html.body.$dialogBox[0].querySelector(":scope > article[data-type=gigInfoPublish] > figure > figure:first-of-type > svg");
		}

		function gigInfoPublishDialogExcelSvg() {
			selection = webPage.html.body.$dialogBox[0].querySelector(":scope > article[data-type=gigInfoPublish] > figure > figure:last-of-type > svg");
		}

		function invalidRequiredFieldsDialogMessage() {
			selection = webPage.html.body.$dialogBox[0].querySelector(":scope > article[data-type=invalidRequiredFields] > p");
		}

		function gigInfoExistsDialogMessage() {
			selection = webPage.html.body.$dialogBox[0].querySelector(":scope > article[data-type=gigInfoExists] > p");
		}

		function gigInfoUpdatedDialogMessage() {
			selection = webPage.html.body.$dialogBox[0].querySelector(":scope > article[data-type=gigInfoUpdated] > p");
		}

		function gigInfoSavedDialogMessage() {
			selection = webPage.html.body.$dialogBox[0].querySelector(":scope > article[data-type=gigInfoSaved] > p");
		}

		function invalidRequiredFieldsDialogButtonBox() {
			selection = webPage.html.body.$dialogBox[0].querySelector(":scope > article[data-type=invalidRequiredFields] > span");
		}

		function gigInfoExistsDialogButtonBox() {
			selection = webPage.html.body.$dialogBox[0].querySelector(":scope > article[data-type=gigInfoExists] > span");
		}

		function gigInfoUpdatedDialogButtonBox() {
			selection = webPage.html.body.$dialogBox[0].querySelector(":scope > article[data-type=gigInfoUpdated] > span");
		}

		function gigInfoSavedDialogButtonBox() {
			selection = webPage.html.body.$dialogBox[0].querySelector(":scope > article[data-type=gigInfoSaved] > span");
		}

		function gigInfoPublishDialogButtonBox() {
			selection = webPage.html.body.$dialogBox[0].querySelector(":scope > article[data-type=gigInfoPublish] > span");
		}

		function dialogBoxButton() {
			selection = webPage.html.body.$dialogBox[0].querySelector(":scope > article > section input, :scope > ul input");
		}

		function invalidRequiredFieldsDialogOkButton() {
			selection = webPage.html.body.$dialogBox[0].querySelector(":scope > article[data-type=invalidRequiredFields] > span > input");
		}

		function gigInfoExistsDialogOkButton() {
			selection = webPage.html.body.$dialogBox[0].querySelector(":scope > article[data-type=gigInfoExists] > span > input");
		}

		function gigInfoUpdatedDialogOkButton() {
			selection = webPage.html.body.$dialogBox[0].querySelector(":scope > article[data-type=gigInfoUpdated] > span > input");
		}

		function gigInfoSavedDialogOkButton() {
			selection = webPage.html.body.$dialogBox[0].querySelector(":scope > article[data-type=gigInfoSaved] > span > input");
		}

		function gigInfoPublishDialogCancelButton() {
			selection = webPage.html.body.$dialogBox[0].querySelector(":scope > article[data-type=gigInfoPublish] > span > input");
		}

		function excelExporterCancelButton() {
			selection = webPage.html.body.$dialogBox[0].querySelector(":scope > table[data-type=excelExporter] > tbody > tr > td:nth-of-type(2) > span > input[value=Cancel]");
		}

		function excelExporterExportButton() {
			selection = webPage.html.body.$dialogBox[0].querySelector(":scope > table[data-type=excelExporter] > tbody > tr > td:nth-of-type(2) > span > input[value=Export]");
		}

		function dialogBoxSection() {
			selection = webPage.html.body.$dialogBox[0].querySelector(":scope > article > section");
		}

		function gigInfoPublishWebDialogSection() {
			selection = webPage.html.body.$dialogBox[0].querySelector(":scope > article[data-type=gigInfoPublishWeb] > section");
		}

		function gigInfoPublishDialogDateInput() {
			selection = webPage.html.body.$dialogBox[0].querySelector(":scope > article[data-type=gigInfoPublishWeb] > section > input[type=date]");
		}

		function gigInfoPublishWebDialogPublishButton() {
			selection = webPage.html.body.$dialogBox[0].querySelector(":scope > article[data-type=gigInfoPublishWeb] > section > span > input:first-of-type");
		}

		function gigInfoPublishWebDialogCancelButton() {
			selection = webPage.html.body.$dialogBox[0].querySelector(":scope > article[data-type=gigInfoPublishWeb] > section > span > input:last-of-type");
		}

		function excelExporterYears() {
			selection = webPage.html.body.$dialogBox[0].querySelectorAll(":scope > table[data-type=excelExporter] > tbody > tr > td:nth-of-type(2) > ul > li > span");
		}

		function excelExporterYearsSelected() {
			selection = [];

			$(webPage.html.body.$dialogBox[0].querySelectorAll(":scope > table[data-type=excelExporter] > tbody > tr > td:nth-of-type(2) > ul > li > span")).filter(function () {
				if (webPage.regex.true.test(this.previousSibling.dataset.selected)) {
					selection.push(this);
				}
			});
		}

		function excelExporterYearsSelectedText() {
			selection = [];

			$(webPage.html.body.$dialogBox[0].querySelectorAll(":scope > table[data-type=excelExporter] > tbody > tr > td:nth-of-type(2) > ul > li > span")).filter(function () {
				if (webPage.regex.true.test(this.previousSibling.dataset.selected)) {
					selection.push(this.textContent);
				}
			});
		}

		function metricElement() {
			selection = document.body.querySelector("#metricElement");
		}
	}
};

WebPage.prototype.setup = function (info) {
	var webPage = this;
	var setup = {
		primary: primary,
		mostRecentGigInfoLoaded: mostRecentGigInfoLoaded,
	};

	setup[info.type]();

	function primary() {
		htmlSetup();
		gigViewerSection();
		dialogBox();

		function htmlSetup() {
			bodySetup();

			function bodySetup() {
				navigationSetup();

				function navigationSetup() {
					$("body").append(webPage.html.body.$metricElement);
					$("body").append(webPage.html.body.$navigation);
				}
			}
		}

		function gigViewerSection() {
			htmlSetup();
			eventSetup();

			function htmlSetup() {
				$("body").append(webPage.html.body.$gigViewerSection[0]);
			}

			function eventSetup() {
				webPage.event({
					type: "gigViewerSection",
					runEvent: "primary",
				});
			}
		}

		function dialogBox() {
			htmlSetup();

			function htmlSetup() {
				$("body").append(webPage.html.body.$dialogBox);
			}
		}
	}

	function mostRecentGigInfoLoaded() {
		htmlSetup();
		uiSetup();
		eventSetup()

		function htmlSetup() {
			webPage.html.body.$statusMenu.insertAfter(webPage.html.selection("statusColumnHeader"));
			webPage.html.body.$dayMenu.insertAfter(webPage.html.selection("dayColumnHeader"));
			webPage.html.body.$monthMenu.insertAfter(webPage.html.selection("monthColumnHeader"));
			webPage.html.body.$yearMenu.insertAfter(webPage.html.selection("yearColumnHeader"));

			webPage.html.body.$gigInfoTableSection.insertBefore(webPage.html.body.$gigViewerSection);

		}

		function uiSetup() {
			webPage.updateUi({
				type: "gigInfoTable",
				modify: "primary",
			});

			webPage.updateUi({
				type: "navigation",
				modify: "primary",
			});

			document.body.style.opacity = 1;
		}

		function eventSetup() {
			webPage.event({
				type: "mostRecentGigInfoLoaded",
				runEvent: "primary",
			});

			webPage.event({
				type: "gigInfoRow",
				runEvent: "primary",
			});
		}
	}
};

WebPage.prototype.event = function (info) {
	var webPage = this;
	var runEvent = {
		mostRecentGigInfoLoaded: mostRecentGigInfoLoaded,
		gigInfoRow: gigInfoRow,
		gigViewerSection: gigViewerSection,
		dialogBox: dialogBox,
	};

	runEvent[info.type](runEvent);

	function mostRecentGigInfoLoaded() {
		var runEvent = {
			primary: primary,
		};

		runEvent[info.runEvent]();

		function primary() {
			$([
				webPage.html.selection("statusColumnHeader"),
				webPage.html.selection("dayColumnHeader"),
				webPage.html.selection("monthColumnHeader"),
				webPage.html.selection("yearColumnHeader"),
			])
				.click(function (clickEvent) {
					webPage.updateUi({
						type: "navigation",
						modify: "toggleHeaderMenu",
						event: clickEvent,
					})
				})
			;

			$(webPage.html.selection("toggleableMenuOptions"))
				.click(function (clickEvent) {
					webPage.updateUi({
						type: "navigation",
						modify: "toggleHeaderMenuOption",
						event: clickEvent,
					})
				})
			;
		}
	}

	function gigInfoRow() {
		var runEvent = {
			primary: primary,
			newRow: newRow,
		};

		runEvent[info.runEvent]();

		function primary() {
			$(webPage.html.selection("allRows"))
				.click(function (clickEvent) {
					webPage.updateUi({
						type: "gigInfoRow",
						modify: "primary",
						event: clickEvent,
					});
				})
			;
		}

		function newRow() {
			info.$newRow
				.click(function (clickEvent) {
					webPage.updateUi({
						type: "gigInfoRow",
						modify: "primary",
						event: clickEvent,
					});
				})
			;
		}
	}

	function gigViewerSection() {
		var runEvent = {
			primary: primary,
		};

		runEvent[info.runEvent]();

		function primary() {
			$(webPage.html.selection("gigViewerCloseButton"))
				.click(function (clickEvent) {
					webPage.updateUi({
						type: "gigViewerSection",
						modify: "close",
						event: clickEvent,
					});
				})
			;

			$(webPage.html.selection("gigViewerNewButton"))
				.click(function (clickEvent) {
					webPage.updateUi({
						type: "gigViewerSection",
						modify: "new",
						event: clickEvent,
					});
				})
			;

			$(webPage.html.selection("gigViewerSaveButton"))
				.click(function (clickEvent) {
					webPage.updateUi({
						type: "gigViewerSection",
						modify: "save",
						event: clickEvent,
					});
				})
			;

			$(webPage.html.selection("gigViewerPublishButton"))
				.click(function (clickEvent) {
					webPage.updateUi({
						type: "gigViewerSection",
						modify: "publish",
						event: clickEvent,
					});
				})
			;

			$(webPage.html.selection("gigReferenceTelephoneInput"))
				.keyup(function (keyupEvent) {
					webPage.regex.inputFormat({
						input: "telephone",
						target: keyupEvent.currentTarget,
					});
				})
			;

			$(webPage.html.selection("gigInvoiceInput"))
				.keyup(function (keyupEvent) {
					webPage.regex.inputFormat({
						input: "invoice",
						target: keyupEvent.currentTarget,
					});
				})
			;

			$(webPage.html.selection("gigReferenceEmailInput"))
				.keyup(function (keyupEvent) {
					webPage.regex.inputFormat({
						input: "email",
						target: keyupEvent.currentTarget,
					});
				})
			;
		}
	}

	function dialogBox() {
		var runEvent = {
			invalidRequiredFieldsDialog: invalidRequiredFieldsDialog,
			gigInfoExistsDialog: gigInfoExistsDialog,
			gigInfoUpdatedDialog: gigInfoUpdatedDialog,
			gigInfoSavedDialog: gigInfoSavedDialog,
			gigInfoPublishDialog: gigInfoPublishDialog,
			gigInfoPublishWebDialog: gigInfoPublishWebDialog,
			noGigsForStartDate: noGigsForStartDate,
			preveiwWebsite: preveiwWebsite,
			excelExportDialog: excelExportDialog,
			openExcelFiles: openExcelFiles,
		};

		runEvent[info.runEvent]();

		function invalidRequiredFieldsDialog() {
			$(webPage.html.selection("invalidRequiredFieldsDialogOkButton"))
				.click(function (clickEvent) {
					webPage.updateUi({
						type: "dialogBox",
						modify: "hide",
						event: clickEvent,
					});
				})
			;
		}

		function gigInfoExistsDialog() {
			$(webPage.html.selection("gigInfoExistsDialogOkButton"))
				.click(function (clickEvent) {
					webPage.updateUi({
						type: "dialogBox",
						modify: "hide",
						event: clickEvent,
					});
				})
			;
		}

		function gigInfoUpdatedDialog() {
			$(webPage.html.selection("gigInfoUpdatedDialogOkButton"))
				.click(function (clickEvent) {
					webPage.updateUi({
						type: "dialogBox",
						modify: "hide",
						event: clickEvent,
					});
				})
			;
		}

		function gigInfoSavedDialog() {
			$(webPage.html.selection("gigInfoSavedDialogOkButton"))
				.click(function (clickEvent) {
					webPage.updateUi({
						type: "dialogBox",
						modify: "hide",
						event: clickEvent,
					});
				})
			;
		}

		function gigInfoPublishDialog() {
			$(webPage.html.selection("gigInfoPublishDialogCancelButton"))
				.click(function (clickEvent) {
					webPage.updateUi({
						type: "dialogBox",
						modify: "hide",
						event: clickEvent,
					});
				})
			;

			$(webPage.html.selection("gigInfoPublishDialogWebFigure"))
				.click(function (clickEvent) {
					webPage.updateUi({
						type: "dialogBox",
						modify: "showPublishWebPageDialog",
						event: clickEvent,
					});
				})
			;

			$(webPage.html.selection("gigInfoPublishDialogExcelFigure"))
				.click(function (clickEvent) {
					webPage.updateUi({
						type: "dialogBox",
						modify: "showPublishExcelPageDialog",
						event: clickEvent,
					});
				})
			;
		}

		function gigInfoPublishWebDialog() {
			$(webPage.html.selection("gigInfoPublishWebDialogPublishButton"))
				.click(function (clickEvent) {
					webPage.updateUi({
						type: "dialogBox",
						modify: "publishWebPage",
						event: clickEvent,
					});
				})
			;

			$(webPage.html.selection("gigInfoPublishWebDialogCancelButton"))
				.click(function (clickEvent) {
					webPage.updateUi({
						type: "dialogBox",
						modify: "publishWebPageCancel",
						event: clickEvent,
					});
				})
			;
		}

		function noGigsForStartDate() {
			$(webPage.html.selection("dialogBoxButton"))
				.click(function (clickEvent) {
					webPage.updateUi({
						type: "dialogBox",
						modify: "showPublishWebPageDialog",
						event: clickEvent,
					});
				})
			;
		}

		function preveiwWebsite() {
			$(webPage.html.selection("dialogBoxButton"))
				.click(function (clickEvent) {
					webPage.updateUi({
						type: "dialogBox",
						modify: "previewPublishedWebsite",
						event: clickEvent,
					});
				})
			;
		}

		function excelExportDialog() {
			$(webPage.html.selection("excelExporterCancelButton"))
				.click(function (clickEvent) {
					webPage.updateUi({
						type: "dialogBox",
						modify: "closeExcelExporter",
						event: clickEvent,
					});
				})
			;

			$(webPage.html.selection("excelExporterYears"))
				.click(function (clickEvent) {
					webPage.updateUi({
						type: "dialogBox",
						modify: "toggleExcelExporterYear",
						event: clickEvent,
					});
				})
			;

			$(webPage.html.selection("excelExporterExportButton"))
				.click(function (clickEvent) {
					webPage.updateUi({
						type: "dialogBox",
						modify: "exportGigInfoToExcelFormat",
						event: clickEvent,
					});
				})
			;
		}

		function openExcelFiles() {
			$(webPage.html.selection("dialogBoxButton"))
				.click(function (clickEvent) {
					webPage.updateUi({
						type: "dialogBox",
						modify: "openExcelFiles",
						event: clickEvent,
					});
				})
			;
		}
	}
};

WebPage.prototype.updateUi = function (info) {
	var webPage = this;
	var update = {
		gigInfoTable: gigInfoTable,
		navigation: navigation,
		gigInfoRow: gigInfoRow,
		gigViewerSection: gigViewerSection,
		dialogBox: dialogBox,
		metricElement: metricElement,
	};

	update[info.type]();

	function gigInfoTable() {
		var modify = {
			primary: primary,
			updateGigCount: updateGigCount,
			updateGigInfoTable: updateGigInfoTable,
		};

		modify[info.modify]();

		function primary() {
			setGigInfoSectionSize();

			function setGigInfoSectionSize() {
				var gigInfoTable = webPage.html.selection("gigInfoTable");

				$(webPage.html.selection("gigInfoSection")).css({
					width: gigInfoTable.offsetWidth,
					height: 630, // Set visually
				});
			}
		}

		function updateGigCount() {
			var updateGigCount = {
				undefined: updateAllGigCounts,
				afterLastSaved: afterLastSaved,
			};

			updateGigCount[info.method]();

			function updateAllGigCounts() {
				$.each(webPage.html.selection("visibleGigCountSpans"), function (visibleGigCountSpanIndex, visibleGigCountSpan) {
					visibleGigCountSpan.innerText = visibleGigCountSpanIndex + 1;
				});
			}

			function afterLastSaved() {
				var row = info.startingRow;
				var rowCountSpan = row.firstChild.firstChild;

				updateInsertedRowCount();
				updateRowCount();

				function updateInsertedRowCount() {
					var insertedRowSpan = row.previousSibling.firstChild.firstChild;
					var insertedRowCount = parseInt(insertedRowSpan.textContent);
					var insertedRowCountUpdate = parseInt(rowCountSpan.textContent);

					if (insertedRowCountUpdate !== insertedRowCount) {
						insertedRowSpan.innerText = insertedRowCountUpdate;
					}
				}

				function updateRowCount() {
					rowCountSpan = row.firstChild.firstChild;

					rowCountSpan.innerText = parseInt(rowCountSpan.textContent) + 1;

					if (row.nextSibling) {
						row = row.nextSibling;

						updateRowCount();
					}
				}
			}
		}

		function updateGigInfoTable() {
			var gigInfoTableRows = "";

			$.each(info.gigInfo.gigs, function (gigIndex, gig){
				gigInfoTableRows += webPage.html.innerHtml({type: "gigInfoTableRow", gig: gig, gigIndex: gigIndex});
			});

			setTimeout(function () {
				webPage.html.selection("gigInfoTableBody").innerHTML = gigInfoTableRows;

				setTimeout(function () {
					webPage.updateUi({
						type: "navigation",
						modify: "primary",
					});

					webPage.html.selection("gigInfoTableBody").style.opacity = 1;
				}, 0);

				setTimeout(function () {
					webPage.updateUi({
						type: "navigation",
						modify: "resetHeaderMenuOptions",
					});	
				}, 0);

				setTimeout(function () {
					webPage.event({
						type: "gigInfoRow",
						runEvent: "primary",
					});
				}, 0);
			}, 0);
		}
	}

	function navigation() {
		var modify = {
			primary: primary,
			toggleHeaderMenu: toggleHeaderMenu,
			toggleHeaderMenuOption: toggleHeaderMenuOption,
			updateHeaderMenuOptions: updateHeaderMenuOptions,
			resetHeaderMenuOptions: resetHeaderMenuOptions,
			hideVisibleHeaderMenu: hideVisibleHeaderMenu,
		};

		modify[info.modify]();

		function primary() {
			positionColumnHeadersAndMenus();

			function positionColumnHeadersAndMenus() {
				var columnLeftPositions = {};

				setColumnPositions();
				positionColumnHeaders();
				positionHeaderMenus();
				setScrollableHeaderMenus();

				function setColumnPositions() {
					var firstVisibleGigInfoRow;

					setCountColumnLeftPosition();
					setStatusColumnLeftPosition();
					setDayColumnLeftPosition();
					setDateColumnLeftPosition();
					setMonthColumnLeftPosition();
					setYearColumnLeftPosition();
					setStartColumnLeftPosition();
					setEndColumnLeftPosition();
					setVenueColumnLeftPosition();

					function setCountColumnLeftPosition() {
						var fistCells = webPage.html.selection("firstCountColumnSpans");
						var leftMostPosition = null;
						var gigInfoRow;

						$.each(fistCells, function (index, cell) {
							gigInfoRow = cell.parentNode.parentNode;

							if (webPage.regex.nothing.test(gigInfoRow.style.display)) {
								if (!leftMostPosition) {
									leftMostPosition = cell.offsetLeft;
									firstVisibleGigInfoRow = gigInfoRow;
								} else if (leftMostPosition && cell.offsetLeft < leftMostPosition) {
									leftMostPosition = cell.offsetLeft;
								}
							}
						});

						columnLeftPositions.count = (webPage.html.selection("gigInfoSection").offsetLeft + leftMostPosition) + "px";
					}

					function setStatusColumnLeftPosition() {
						var firstVisibleGigStatusCell = firstVisibleGigInfoRow.childNodes[1];
						var firstVisibleGigStatusFigure = firstVisibleGigInfoRow.childNodes[1].firstChild;
						
						columnLeftPositions.status = (webPage.html.selection("gigInfoSection").offsetLeft + firstVisibleGigStatusCell.offsetLeft + firstVisibleGigStatusFigure.offsetLeft) + "px";
					}

					function setDayColumnLeftPosition() {
						var firstVisibleGigDayCell = firstVisibleGigInfoRow.childNodes[2];
						var firstVisibleGigDayFigure = firstVisibleGigInfoRow.childNodes[2].firstChild;

						columnLeftPositions.day = (webPage.html.selection("gigInfoSection").offsetLeft + firstVisibleGigDayCell.offsetLeft + firstVisibleGigDayFigure.offsetLeft) + "px";
					}

					function setDateColumnLeftPosition() {
						var firstVisibleGigDateCell = firstVisibleGigInfoRow.childNodes[3];
						var firstVisibleGigDateFigure = firstVisibleGigInfoRow.childNodes[3].firstChild;

						columnLeftPositions.date = (webPage.html.selection("gigInfoSection").offsetLeft + firstVisibleGigDateCell.offsetLeft + firstVisibleGigDateFigure.offsetLeft) + "px";
					}

					function setMonthColumnLeftPosition() {
						var firstVisibleGigMonthCell = firstVisibleGigInfoRow.childNodes[4];
						var firstVisibleGigMonthFigure = firstVisibleGigInfoRow.childNodes[4].firstChild;

						columnLeftPositions.month = (webPage.html.selection("gigInfoSection").offsetLeft + firstVisibleGigMonthCell.offsetLeft + firstVisibleGigMonthFigure.offsetLeft) + "px";
					}

					function setYearColumnLeftPosition() {
						var firstVisibleGigYearCell = firstVisibleGigInfoRow.childNodes[5];
						var firstVisibleGigYearFigure = firstVisibleGigInfoRow.childNodes[5].firstChild;

						columnLeftPositions.year = (webPage.html.selection("gigInfoSection").offsetLeft + firstVisibleGigYearCell.offsetLeft + firstVisibleGigYearFigure.offsetLeft) + "px";
					}

					function setStartColumnLeftPosition() {
						var firstVisibleGigStartCell = firstVisibleGigInfoRow.childNodes[6];
						var firstVisibleGigStartFigure = firstVisibleGigInfoRow.childNodes[6].firstChild;

						columnLeftPositions.start = (webPage.html.selection("gigInfoSection").offsetLeft + firstVisibleGigStartCell.offsetLeft + firstVisibleGigStartFigure.offsetLeft) + "px";
					}

					function setEndColumnLeftPosition() {
						var firstVisibleGigEndCell = firstVisibleGigInfoRow.childNodes[7];
						var firstVisibleGigEndFigure = firstVisibleGigInfoRow.childNodes[7].firstChild;

						columnLeftPositions.end = (webPage.html.selection("gigInfoSection").offsetLeft + firstVisibleGigEndCell.offsetLeft + firstVisibleGigEndFigure.offsetLeft) + "px";
					}

					function setVenueColumnLeftPosition() {
						var firstVisibleGigVenueCell = firstVisibleGigInfoRow.childNodes[8];
						var firstVisibleGigVenueFigure = firstVisibleGigInfoRow.childNodes[8].firstChild;

						columnLeftPositions.venue = (webPage.html.selection("gigInfoSection").offsetLeft + firstVisibleGigVenueCell.offsetLeft + firstVisibleGigVenueFigure.offsetLeft) + "px";
					}
				}

				function positionColumnHeaders() {
					var columnHeader;
					var columnHeaderSelectionName;

					$.each(columnLeftPositions, function (columnName, leftPosition) {
						columnHeaderSelectionName = columnName + "ColumnHeader";
						webPage.html.selection(columnHeaderSelectionName).style.left = leftPosition;
					});
				}

				function positionHeaderMenus() {
					var heightFactor = 1.2;
					var headersAndMenus = {
						status: {
							header: webPage.html.selection("statusColumnHeader"),
							menu: webPage.html.body.$statusMenu,
						},
						day: {
							header: webPage.html.selection("dayColumnHeader"),
							menu: webPage.html.body.$dayMenu,
						},
						month: {
							header: webPage.html.selection("monthColumnHeader"),
							menu: webPage.html.body.$monthMenu,
						},
						year: {
							header: webPage.html.selection("yearColumnHeader"),
							menu: webPage.html.body.$yearMenu,
						},
					};
					var menuTopPosition = headersAndMenus.status.header.offsetTop + (headersAndMenus.status.header.offsetHeight * heightFactor);

					$.each(headersAndMenus, function (headerAndMenuKey, headerAndMenu) {
						if (!webPage.regex.visible.test(headerAndMenu.menu[0].style.visibility)) {
							headerAndMenu.menu.css({
								top: menuTopPosition,
								left: headerAndMenu.header.style.left,
								visibility: "hidden",
							});
						} else {
							headerAndMenu.menu.css({
								top: menuTopPosition,
								left: headerAndMenu.header.style.left,
							});
						}
					});
				}

				function setScrollableHeaderMenus() {
					var scrollableHeaderMenus = [
						webPage.html.body.$monthMenu,
						webPage.html.body.$yearMenu,
					];

					$.each(scrollableHeaderMenus, function ($scrollableHeaderMenuIndex, $scrollableHeaderMenu) {
						if ($scrollableHeaderMenu[0].offsetHeight > webPage.html.body.$dayMenu[0].offsetHeight) {
							$scrollableHeaderMenu.css({
								height: webPage.html.body.$dayMenu[0].offsetHeight + "px",
								overflow: "auto",
							});
						}
					});
				}
			}
		}

		function toggleHeaderMenu() {
			var headerMenu = info.event.currentTarget.nextSibling;

			if (webPage.regex.hidden.test(headerMenu.style.visibility)) {
				hideLastActiveMenu();
				headerMenu.style.visibility = "visible";
			} else {
				headerMenu.style.visibility = "hidden";
			}

			function hideLastActiveMenu() {
				var menus = [
					webPage.html.body.$statusMenu[0],
					webPage.html.body.$dayMenu[0],
					webPage.html.body.$monthMenu[0],
					webPage.html.body.$yearMenu[0],
				];

				$.each(menus, function (menuIndex, menu) {
					if (webPage.regex.visible.test(menu.style.visibility)) {
						menu.style.visibility = "hidden";
						return false; // exit $.each itteration (NB! It's a function not a loop. So 'break' won't work)
					}
				});
			}
		}

		function toggleHeaderMenuOption() {
			var menuOption = info.event.currentTarget;
			var toggleMenuOption = {
				on: toggleHeaderMenuOptionOff,
				off: toggleHeaderMenuOptionOn,
			};

			toggleMenuOption[menuOption.dataset.toggle]();

			function toggleHeaderMenuOptionOff() {
				webPage.html.data.currentOptionMenu = menuOption.parentNode; // Reference to current menu for use in the selection method.

				if (webPage.html.selection("currentMenuToggleOnOptions").length > 1) {
					var menuName = menuOption.parentNode.dataset.menu;
					var menuOptionName = menuOption.innerText;
					var hideCorrespondingTableData = new function () {
						this.status = status;
						this.day = this.month = dayMonth;
						this.year = year;
					};

					menuOption.dataset.toggle = "off";

					webPage.regex.addRegexPattern({
						pattern: menuOptionName,
						flags: "i",
					});

					setTimeout(function () {
						hideCorrespondingTableData[menuName]();

						setTimeout(function () {
							webPage.updateUi({
								type: "navigation",
								modify: "primary",
							});
						}, 0);

						setTimeout(function () {
							webPage.updateUi({
								type: "gigInfoTable",
								modify: "updateGigCount",
							});
						}, 0);

						setTimeout(function () {
							webPage.updateUi({
								type: "navigation",
								modify: "updateHeaderMenuOptions",
							});
						}, 0);
					}, 0);

					function status() {
						$.each(webPage.html.selection("allVisibleStatusCells"), function (gigStatusCellIndex, gigStatusCell) {
							if (webPage.regex[menuOptionName].test(gigStatusCell.dataset.status)) {
								gigStatusCell.parentNode.style.display = "none";
							}
						});
					}

					function dayMonth() {
						var headerName = webPage.html.data.currentOptionMenu.previousSibling.innerText;

						$.each(webPage.html.selection("allVisible" + headerName + "Cells"), function (gigInfoCellIndex, gigInfoCell) {
							if (webPage.regex[menuOptionName].test(gigInfoCell.innerText)) {
								gigInfoCell.parentNode.style.display = "none";
							}
						});
					}

					function year() {

					}
				}
			}

			function toggleHeaderMenuOptionOn() {
				webPage.html.data.currentOptionMenu = menuOption.parentNode; // Reference to current menu for use in the selection method.
				var menuName = menuOption.parentNode.dataset.menu;
				var menuOptionName = menuOption.innerText;
				var showCorrespondingTableData = new function () {
					this.status = status;
					this.day = this.month = dayMonth;
					this.year = year;
				};

				webPage.regex.addRegexPattern({
					pattern: menuOptionName,
					flags: "i",
				});

				setTimeout(function () {
					showCorrespondingTableData[menuName]();

					setTimeout(function () {
						webPage.updateUi({
							type: "navigation",
							modify: "primary",
						});
					}, 0);

					setTimeout(function () {
						webPage.updateUi({
							type: "gigInfoTable",
							modify: "updateGigCount",
						});
					}, 0);

					setTimeout(function () {
						webPage.updateUi({
							type: "navigation",
							modify: "updateHeaderMenuOptions",
						});
					}, 0);
				}, 0);

				function status() {
					menuOption.dataset.toggle = "on";

					$.each(webPage.html.selection("allInVisibleStatusCells"), function (gigStatusCellIndex, gigStatusCell) {
						if (webPage.regex[menuOptionName].test(gigStatusCell.dataset.status)) {
							gigStatusCell.parentNode.style.display = "";
						}
					});
				}

				function dayMonth() {
					var headerName = webPage.html.data.currentOptionMenu.previousSibling.innerText;

					menuOption.dataset.toggle = "on";

					$.each(webPage.html.selection("allInVisible" + headerName + "Cells"), function (gigInfoCellIndex, gigInfoCell) {
						if (webPage.regex[menuOptionName].test(gigInfoCell.innerText)) {
							gigInfoCell.parentNode.style.display = "";
						}
					});
				}

				function year() {
					toggleYearOptionFigures();
					requestYearOptionGigInfo();

					function toggleYearOptionFigures() {
						var yearOptionToggledOn = webPage.html.selection("currentMenuToggleOnOptions")[0];

						menuOption.dataset.toggle = "on";
						yearOptionToggledOn.dataset.toggle = "off";
					}

					function requestYearOptionGigInfo() {
						webPage.html.selection("gigInfoTableBody").style.opacity = 0; // Transition of 550ms (in CSS file)

						setTimeout(function () {
							$.ajax({
								url: "/loadGigInfo/",
								dataType: "json",
								success: function (gigInfo) {
									webPage.updateUi({
										type: "gigInfoTable",
										modify: "updateGigInfoTable",
										gigInfo: gigInfo
									})
								},
								error: reqeustYearGigInfoError,
								data: {
									gigInfoRequestMethod: "year",
									year: menuOption.innerText,
								},
							});
						}, 550);

						function reqeustYearGigInfoError(xhr, status, strError) {
							console.log("Error requesting information for the most recent gigs:", strError);
						}
					}
				}
			}
		}

		function updateHeaderMenuOptions() {
			var getMenuInfo = {
				status: status,
				day: day,
				month: month,
			}
			var menusNamesToUpdate = getMenuNamesToUpdate();

			$.each(menusNamesToUpdate, function (menuNameIndex, menuName) {
				setTimeout(function () {
					var menuInfo = getMenuInfo[menuName]();
					
					$.each(menuInfo.options, function (optionIndex, option) {
						var optionNameIndex = menuInfo.values.indexOf(option.textContent);

						if (optionNameIndex === -1) { // The option is not reflected in the gig info table
							option.dataset.toggle = "off";
						} else if (optionNameIndex >= 0 && webPage.regex.off.test(option.dataset.toggle)) {
							option.dataset.toggle = "on";
						}
					});
				}, 0);
			});

			function getMenuNamesToUpdate() {
				var currentMenuName = webPage.html.data.currentOptionMenu.dataset.menu;
				var menuNames = Object.keys(getMenuInfo);
				var menusNamesToUpdate = menuNames.slice(
					0,
					menuNames.indexOf(currentMenuName)
				).concat(menuNames.slice(
					menuNames.indexOf(currentMenuName) + 1
				));

				return menusNamesToUpdate;
			}

			function status() {
				var menuInfo = {
					options: webPage.html.selection("selectableStatusMenuOptions"),
					values: webPage.html.selection("representativeGigStatusText"),
				};

				return menuInfo;
			}

			function day() {
				var menuInfo = {
					options: webPage.html.selection("selectableDayMenuOptions"),
					values: webPage.html.selection("representativeGigDayText"),
				};

				return menuInfo;
			}

			function month() {
				var menuInfo = {
					options: webPage.html.selection("selectableMonthMenuOptions"),
					values: webPage.html.selection("representativeGigMonthText"),
				};

				return menuInfo;
			}
		}

		function resetHeaderMenuOptions() {
			var representativeGigStatusText;
			var gigStatusIndex;
			var menusNamesToUpdate = {
				status: {
					representativeText: "representativeGigStatusText",
					menuOptions: "statusMenuOptions",
				},
				day: {
					representativeText: "representativeGigDayText",
					menuOptions: "dayMenuOptions",
				},
				month: {
					representativeText: "representativeGigMonthText",
					menuOptions: "monthMenuOptions",
				},
			}; 
			var menuOptionDataOn;
			var setMenuOptionDataOn = {
				true: enableMenuOptionData,
				false: disableMenuOptionData,
			};

			$.each(menusNamesToUpdate, function (menuNameSelectorIndex, menuNameSelector) {
				setTimeout(function() {
					representativeText = webPage.html.selection(menuNameSelector.representativeText);				
					menuOptions = webPage.html.selection(menuNameSelector.menuOptions);

					$.each(menuOptions, function (menuOptionIndex, menuOption) {
						gigStatusIndex = representativeText.indexOf(menuOption.textContent);

						if (gigStatusIndex >= 0) {
							menuOptionDataOn = true;
						} else {
							menuOptionDataOn = false;
						}

						setMenuOptionDataOn[menuOptionDataOn](menuOption);
					});
				}, 0);
			});

			function enableMenuOptionData(menuOption) {
				enableMenuOptionSelectability();
				toggleMenuOptionOn();

				function enableMenuOptionSelectability() {
					if (webPage.regex.false.test(menuOption.dataset.selectable)) {
						menuOption.dataset.selectable = true;
						menuOption.firstChild.dataset.present = true;
					}
				}

				function toggleMenuOptionOn() {
					if (
					menuOption.hasAttribute("data-toggle") && webPage.regex.off.test(menuOption.dataset.toggle) ||
					!menuOption.hasAttribute("data-toggle")
					) {
						menuOption.dataset.toggle = "on";
					}
				}
			}

			function disableMenuOptionData(menuOption) {
				disableMenuOptionSelectability()
				toggleMenuOptionOff()

				function disableMenuOptionSelectability() {
					if (webPage.regex.true.test(menuOption.dataset.selectable)) {
						menuOption.dataset.selectable = false;
						menuOption.firstChild.dataset.present = false;
					}
				}

				function toggleMenuOptionOff() {
					if (menuOption.hasAttribute("data-toggle")) {
						menuOption.removeAttribute("data-toggle");
					}
				}
			}
		}

		function hideVisibleHeaderMenu() {
			var visibleHeaderMenu = webPage.html.selection("visibleHeaderMenu");

			if (visibleHeaderMenu) {
				visibleHeaderMenu.style.visibility = "hidden";
			}
		}
	}

	function gigInfoRow() {
		var modify = {
			primary: primary,
			updateGigRow: updateGigRow,
			insertNewRow: insertNewRow,
		};

		modify[info.modify]();

		function primary() {
			var gigInfoRow = info.event.currentTarget;

			setTimeout(function () {
				webPage.updateUi({
					type: "gigViewerSection",
					modify: "open",
					gigInfoRow: gigInfoRow,
				})
			}, 0);

			setTimeout(function () {
				webPage.updateUi({
					type: "navigation",
					modify: "hideVisibleHeaderMenu",
				})
			}, 0);
		}

		function updateGigRow() {
			var updatedGigInfoRow;
			var dateTimeChanged = false;

			setUpdatedGigInfoRow();

			if (updatedGigYearUnchanged()) {
				updateSavedGigRow();
			} else {
				removeUpdatedGigInfoRow();
			}

			function setUpdatedGigInfoRow() {
				var rowGigInfo;

				$.each(webPage.html.selection("allVisibleRows"), function (rowIndex, row) {
					rowGigInfo = JSON.parse(row.dataset.gigInfo);

					if (rowGigInfo.id === info.gigInfo.id) {
						updatedGigInfoRow = row;

						return false;
					}
				});
			}

			function updatedGigYearUnchanged() {
				var updatedGigYearUnchanged = null;
				var gigYearCell = updatedGigInfoRow.childNodes[5];

				if (info.gigInfo.date.year == gigYearCell.textContent) {
					updatedGigYearUnchanged = true;
				} else {
					updatedGigYearUnchanged = false;
				}

				return updatedGigYearUnchanged;
			}

			function updateSavedGigRow() {
				updateGigStatus();
				updateGigDay();
				updateGigDate();
				updateGigMonth();
				updateGigStartTime();
				updateGigEndTime();
				updateGigVenue();

				updatedGigInfoRow.dataset.gigInfo = JSON.stringify(info.gigInfo);

				if (dateTimeChanged) {
					removeUpdatedGigInfoRow();

					info.gigInfo.row = updatedGigInfoRow;

					insertNewRow();
				}

				function updateGigStatus() {
					var savedGigStatus = webPage.html.getGigStatus(info.gigInfo);
					var gigStatusCell = updatedGigInfoRow.childNodes[1];

					if (savedGigStatus !== gigStatusCell.dataset.status) {
						gigStatusCell.dataset.status = savedGigStatus;
					}
				}

				function updateGigDay() {
					var gigDayCell = updatedGigInfoRow.childNodes[2];

					if (info.gigInfo.date.dayName !== gigDayCell.textContent) {
						gigDayCell.firstChild.textContent = info.gigInfo.date.dayName;
					}
				}

				function updateGigDate() {
					var gigDateCell = updatedGigInfoRow.childNodes[3];

					if (info.gigInfo.date.day !== gigDateCell.textContent) {
						gigDateCell.firstChild.textContent = info.gigInfo.date.day;

						dateTimeChanged = true;
					}
				}

				function updateGigMonth() {
					var gigMonthCell = updatedGigInfoRow.childNodes[4];

					if (info.gigInfo.date.monthName !== gigMonthCell.textContent) {
						gigMonthCell.firstChild.textContent = info.gigInfo.date.monthName;

						if (!dateTimeChanged) {
							dateTimeChanged = true;
						}
					}
				}

				function updateGigStartTime() {
					var gigStartCell = updatedGigInfoRow.childNodes[6];
					var savedGigStart = [info.gigInfo.start.hour, info.gigInfo.start.minute].join(":");

					if (savedGigStart !== gigStartCell.textContent) {
						gigStartCell.firstChild.textContent = savedGigStart;

						if (!dateTimeChanged) {
							dateTimeChanged = true;
						}
					}
				}

				function updateGigEndTime() {
					var gigEndCell = updatedGigInfoRow.childNodes[7];
					var savedGigEnd = [info.gigInfo.end.hour, info.gigInfo.end.minute].join(":");

					if (savedGigEnd !== gigEndCell.textContent) {
						gigEndCell.firstChild.textContent = savedGigEnd;
					}
				}

				function updateGigVenue() {
					var gigVenueCell = updatedGigInfoRow.childNodes[8];

					if (info.gigInfo.venue !== gigVenueCell.textContent) {
						gigVenueCell.firstChild.textContent = info.gigInfo.venue;
					}
				}
			}

			function removeUpdatedGigInfoRow() {
				webPage.html.selection("gigInfoTableBody").removeChild(updatedGigInfoRow);

				webPage.updateUi({
					type: "gigInfoTable",
					modify: "updateGigCount",
				});
			}
		}

		function insertNewRow() {
			var $savedGigRow;
			var currentYear = webPage.html.selection("currentYearMenuOption").textContent;
			var savedGigNextSibling;

			if (info.gigInfo.date.year == currentYear) {
				setSavedGigNextSibling();
				insertSavedGigRow();
				updateGigRowCounts();
			}

			function setSavedGigNextSibling(){
				var allVisibleRows = webPage.html.selection("allVisibleRows");
				var savedGigMonthFound;
				var sameMonthGigRows = [];

				updateSameMonthGigRows();

				if (sameMonthGigRows.length > 0) {
					setNextSiblingBasedOnSameMonth();
				} else {
					setNextSiblingBasedOnOtherMonths();
				}

				function updateSameMonthGigRows() {
					$.each(allVisibleRows, function (rowIndex, row) {
						rowGigInfo = JSON.parse(row.dataset.gigInfo);

						setSavedGigMonthFound();
						setSameMonthGigRows();

						if (sameMonthGigRows) {
							return false;
						}

						function setSavedGigMonthFound() {
							if (info.gigInfo.date.month === rowGigInfo.date.month && savedGigMonthFound === undefined) {
								savedGigMonthFound = true;
							}
						}

						function setSameMonthGigRows() {
							if (savedGigMonthFound) {
								var sameMonthGigRow = row;

								sameMonthGigRows.push(row);

								updateSameMonthGigRows();

								function updateSameMonthGigRows() {
									if (sameMonthGigRow.nextSibling) {
										var nextGigRowInfo = JSON.parse(sameMonthGigRow.nextSibling.dataset.gigInfo);

										if (nextGigRowInfo.date.month === rowGigInfo.date.month) {
											sameMonthGigRows.push(sameMonthGigRow.nextSibling);

											sameMonthGigRow = sameMonthGigRow.nextSibling;

											updateSameMonthGigRows();
										}
									}
								}
							}
						}
					});
				}

				function setNextSiblingBasedOnSameMonth() {
					var gigsOnSameDay = [];

					setGigsOnSameDay();

					if (gigsOnSameDay.length > 0) {
						setNextSiblingBasedOnTime();
					} else {
						setNextSiblingBasedOnDay();
					}

					function setGigsOnSameDay() {
						var rowGigInfo;

						$.each(sameMonthGigRows, function (rowIndex, row) {
							rowGigInfo = JSON.parse(row.dataset.gigInfo);

							if (rowGigInfo.date.day === info.gigInfo.date.day) {
								gigsOnSameDay.push(row);
							}
						});
					}

					function setNextSiblingBasedOnTime() {
						var gigsAtSameTime = [];

						setGigsAtSameTime();

						if (gigsAtSameTime.length > 0) {
							setNextSiblingBasedOnVenue()
						} else {
							setNextSiblingBasedOnStartTime();
						}

						function setGigsAtSameTime() {
							var rowGigInfo;
							var rowGigStartTime;
							var savedGigStartTime = info.gigInfo.start.hour + info.gigInfo.start.minute;

							$.each(gigsOnSameDay, function (rowIndex, row) {
								rowGigInfo = JSON.parse(row.dataset.gigInfo);
								rowGigStartTime = rowGigInfo.start.hour + rowGigInfo.start.minute;

								if (rowGigStartTime === savedGigStartTime) {
									gigsAtSameTime.push(row);
								}
							});
						}

						function setNextSiblingBasedOnVenue() {
							var allVenues;
							var venuesAtSameTime;
							var savedGigVenueIndex;

							setVenues();
							setSavedGigVenueIndex();
							setSavedGigNextSiblingRow();

							function setVenues() {
								setVenuesAtSameTime();
								setAllVenues();

								function setVenuesAtSameTime() {
									venuesAtSameTime = [];

									$.each(gigsAtSameTime, function (rowIndex, row) {
										venuesAtSameTime.push(JSON.parse(row.dataset.gigInfo).venue);
									});
								}

								function setAllVenues() {
									allVenues = venuesAtSameTime.slice();
									allVenues.push(info.gigInfo.venue);
									allVenues.sort();
								}
							}

							function setSavedGigVenueIndex() {
								savedGigVenueIndex = allVenues.indexOf(info.gigInfo.venue);
							}

							function setSavedGigNextSiblingRow() {
								var method;
								var setSavedGigNextSibling = {
									beforeNextMonth: beforeNextMonth,
									withinMonth: withinMonth,
								};

								setSavedGigNextSiblingRowMethod();

								setSavedGigNextSibling[method]();

								function setSavedGigNextSiblingRowMethod() {
									if (savedGigVenueIndex === allVenues.length - 1) {
										method = "beforeNextMonth";
									} else {
										method = "withinMonth";
									}
								}

								function beforeNextMonth() {
									savedGigNextSibling = gigsAtSameTime[gigsAtSameTime.length - 1].nextSibling;
								}

								function withinMonth() {
									var savedGigNextSiblingVenue = allVenues[savedGigVenueIndex + 1];
									var savedGigNextSiblingIndex = venuesAtSameTime.indexOf(savedGigNextSiblingVenue);

									savedGigNextSibling = gigsAtSameTime[savedGigNextSiblingIndex];
								}
							}
						}

						function setNextSiblingBasedOnStartTime() {
							setNextSiblingIfSavedGigStartsBetween();
							setNextSiblingIfSavedGigStartsLast();

							function setNextSiblingIfSavedGigStartsBetween() {
								var savedGigStartTimeInt = parseInt(info.gigInfo.start.hour + info.gigInfo.start.minute);
								var rowGigStartTimeInt;
								var rowGigStart;

								$.each(gigsOnSameDay, function (rowIndex, row) {
									rowGigStart = JSON.parse(row.dataset.gigInfo).start;
									rowGigStartTimeInt = parseInt(rowGigStart.hour + rowGigStart.minute);

									if (savedGigStartTimeInt < rowGigStartTimeInt) {
										savedGigNextSibling = row;

										return false;
									}
								});
							}

							function setNextSiblingIfSavedGigStartsLast() {
								if (!savedGigNextSibling) {
									savedGigNextSibling = gigsOnSameDay[gigsOnSameDay.length - 1].nextSibling;
								}
							}
						}
					}

					function setNextSiblingBasedOnDay() {
						var rowDay;

						$.each(sameMonthGigRows, function (rowIndex, row) {
							rowDay = JSON.parse(row.dataset.gigInfo).date.day;

							if (rowDay > info.gigInfo.date.day) {
								savedGigNextSibling = row;

								return false;
							}
						});

						if (!savedGigNextSibling) {
							savedGigNextSibling = sameMonthGigRows[sameMonthGigRows.length -1].nextSibling;
						}
					}
				}

				function setNextSiblingBasedOnOtherMonths() {
					var rowGigMonth;

					$.each(allVisibleRows, function (rowIndex, row) {
						rowGigMonth = JSON.parse(row.dataset.gigInfo).date.month;

						if (rowGigMonth > info.gigInfo.date.month) {
							savedGigNextSibling = row;

							return false;
						}
					});
				}
			}

			function insertSavedGigRow() {
				setSavedGigRow();
				insertIntoGigInfoTable();
				
				function setSavedGigRow() {
					if (info.gigInfo.row) {
						$savedGigRow = $(info.gigInfo.row);
					} else {
						$savedGigRow = $(webPage.html.innerHtml({
							type: "gigInfoTableRow",
							gig: info.gigInfo,
							gigIndex: getSavedGigRowIndex(),
						}));

						webPage.event({
							type: "gigInfoRow",
							runEvent: "newRow",
							$newRow: $savedGigRow,
						});
					}

					function getSavedGigRowIndex() {
						var gigIndex;

						if (savedGigNextSibling) {
							gigIndex = parseInt(savedGigNextSibling.firstChild.textContent) - 1;
						} else {
							gigIndex = parseInt(webPage.html.selection("lastGigRow").textContent);
						}

						return gigIndex;
					}
				}

				function insertIntoGigInfoTable() {
					if (savedGigNextSibling) {
						$savedGigRow.insertBefore(savedGigNextSibling);
					} else {
						$savedGigRow.insertAfter(webPage.html.selection("lastGigRow"));
					}
				}
			}

			function updateGigRowCounts() {
				if (savedGigNextSibling) {
					webPage.updateUi({
						type: "gigInfoTable",
						modify: "updateGigCount",
						method: "afterLastSaved",
						startingRow: savedGigNextSibling,
					});
				}
			}
		}
	}

	function gigViewerSection() {
		var modify = {
			primary: primary,
			loadVenuDataList: loadVenuDataList,
			loadSelectedGigInfo: loadSelectedGigInfo,
			open: open,
			close: close,
			new: newGig,
			save: save,
			publish: publish,
			underlineInvalidRequiredFields: underlineInvalidRequiredFields,
			removeInvalidRequiredFieldsUnderline: removeInvalidRequiredFieldsUnderline,
		};

		modify[info.modify]();

		function primary() {
			setGigNotesBorder();
			fixGivViewerFormSize();

			function setGigNotesBorder() {
				webPage.html.selection("gigViewerNotesInput").style.border = "0.1em solid white";
			}

			function fixGivViewerFormSize() {
				var gigViewerForm = webPage.html.selection("gigViewerForm");

				if (webPage.regex.nothing.test(gigViewerForm.style.width)) {
					var heightFactor = 1.04;

					$(gigViewerForm).css({
						width: webPage.html.selection("gigViewerNotesInput").offsetWidth + "px",
						height: (gigViewerForm.offsetHeight * heightFactor) + "px",
					});
				}
			}
		}

		function loadSelectedGigInfo() {
			setGigDatabaseId();
			loadVenue();
			loadDate();
			loadGigTime();
			loadInvoice();
			loadStatus();
			loadReference();
			loadNotes();

			function setGigDatabaseId() {
				webPage.html.selection("gigViewerForm").dataset.dbId = info.gigInfo.id;
			}

			function loadVenue() {
				webPage.html.selection("gigVenueInput").value = info.gigInfo.venue;
			}

			function loadDate() {
				webPage.html.selection("gigDateInput").value = [
					info.gigInfo.date.year,
					webPage.regex.doubleDigitFormat(info.gigInfo.date.month),
					webPage.regex.doubleDigitFormat(info.gigInfo.date.day),
				].join("-");
			}

			function loadGigTime() {
				var gigTimes = [
					{
						input: webPage.html.selection("gigStartTimeInput"),
						time: info.gigInfo.start,
					},
					{
						input: webPage.html.selection("gigEndTimeInput"),
						time: info.gigInfo.end,
					}
				];

				$.each(gigTimes, function (gigTimeIndex, gigTime) {
					gigTime.input.value = [
						webPage.regex.doubleDigitFormat(gigTime.time.hour),
						webPage.regex.doubleDigitFormat(gigTime.time.minute),
					].join(":");
				});
			}

			function loadInvoice() {
				webPage.html.selection("gigInvoiceInput").value = info.gigInfo.invoice.quote;
			}

			function loadStatus() {
				webPage.html.selection("gigStatusInput").value = getGigStatus();

				function getGigStatus() {
					var gigStatus;

					if (webPage.regex.True.test(info.gigInfo.cancelled)) {
						gigStatus = "cancelled";
					} else if (webPage.regex.False.test(info.gigInfo.cancelled) && webPage.regex.True.test(info.gigInfo.invoice.paid)) {
						gigStatus = "paid";
					} else if (webPage.regex.False.test(info.gigInfo.cancelled) && webPage.regex.False.test(info.gigInfo.invoice.paid)) {
						gigStatus = "unpaid";
					}

					return gigStatus;
				}
			}

			function loadReference() {
				loadReferenceName();
				loadReferenceEmail();
				loadReferenceTelephone();

				function loadReferenceName() {
					webPage.html.selection("gigReferenceNameInput").value = info.gigInfo.reference.name;
				}

				function loadReferenceEmail() {
					webPage.html.selection("gigReferenceEmailInput").value = info.gigInfo.reference.email;
				}

				function loadReferenceTelephone() {
					webPage.html.selection("gigReferenceTelephoneInput").value = webPage.regex.telephoneNumberFormat(info.gigInfo.reference.tel);
				}
			}

			function loadNotes() {
				webPage.html.selection("gigViewerNotesInput").value = info.gigInfo.notes;
			}
		}

		function open() {
			uncheckRequiredFieldLabelValidity();
			overlayGigViewer();
			displayGigInfoViewer();
			webPage.updateUi({
				type: "gigViewerSection",
				modify: "loadVenuDataList",
			});

			function uncheckRequiredFieldLabelValidity() {
				$.each(webPage.html.selection("requiredLabels"), function (labelIndex, label) {
					label.dataset.validity = "unchecked";
				});
			}

			function overlayGigViewer() {
				webPage.html.body.$gigViewerSection.css({
					visibility: "visible",
					opacity: 1,
				});
				setTimeout(function ()  {
					webPage.updateUi({
						type: "gigViewerSection",
						modify: "primary",
					});
				}, 0);
			}

			function displayGigInfoViewer() {
				setTimeout(function () {
					webPage.updateUi({
						type: "gigViewerSection",
						modify: "loadSelectedGigInfo",
						gigRow: info.gigInfoRow,
						gigInfo: JSON.parse(info.gigInfoRow.dataset.gigInfo),
					});
				}, 0);
			}
		}

		function loadVenuDataList() {
			$.ajax({
				url: "/requestGigViewerDataListOptions/",
				dataType: "json",
				success: setGigViewerDataListOptions,
				error: reqeustVenuesError,
			});

			function setGigViewerDataListOptions(gigViewerDataListOptions) {
				var dataListName;
				var dataListOptions;

				$.each(gigViewerDataListOptions, function (dataListName, dataListOptions) {
					setTimeout(function () {
						setDataListOptions(dataListName);
					}, 0);
				});

				function setDataListOptions(dataListName) {
					var currentDataList = getCurrentDataList();
					var $newDataList = $(webPage.html.innerHtml({
						type: "dataList",
						dataListName: dataListName,
						dataListOptions: gigViewerDataListOptions[dataListName],
					}));

					if (currentDataList.innerHTML !== $newDataList[0].innerHTML) {
						currentDataList.innerHTML = $newDataList[0].innerHTML;
					}

					function getCurrentDataList() {
						var currentDataList;
						var dataListSelectors = {
							venues: "venueList",
							references: "referenceList",
							telephones: "telephoneList",
							emails: "emailList"
						};

						currentDataList = webPage.html.selection(dataListSelectors[dataListName]);

						return currentDataList;
					}
				}
			}

			function reqeustVenuesError(xhr, status, strError) {
				console.log("Error requesting information for the most recent gigs:", strError);
			}
		}

		function close() {
			webPage.html.body.$gigViewerSection[0].style.opacity = 0;

			setTimeout(function () {
				webPage.html.body.$gigViewerSection[0].style.visibility = "hidden";

				webPage.updateUi({
					type: "gigViewerSection",
					modify: "removeInvalidRequiredFieldsUnderline"
				});
			}, 550); // Based on opacity transition
		}

		function newGig() {
			resetGigViewerForm();
			setGigStatusToUnpaid();
			resetGigDatabaseId();
			webPage.updateUi({
				type: "gigViewerSection",
				modify: "loadVenuDataList",
			});

			function resetGigViewerForm() {
				webPage.html.selection("gigViewerForm").reset();
			}

			function resetGigDatabaseId() {
				webPage.html.selection("gigViewerForm").dataset.dbId = "";
			}

			function setGigStatusToUnpaid() {
				webPage.html.selection("gigStatusInput").value = "unpaid";
			}
		}

		function save() {
			var gigDbObject = getGigDbObject();
			var invalidRequiredFieldLabels = getInvalidRequiredFieldLabels();

			if (invalidRequiredFieldLabels.length > 0) {
				webPage.updateUi({
					type: "dialogBox",
					modify: "showInvalidRequiredFieldsDialog",
				});
			} else {
				$.ajax({
					url: "/saveGigInfo/",
					dataType: "json",
					success: gigInfoSaved,
					error: saveGigInfoError,
					type: "POST",
					data: gigDbObject,
				});
			}

			function getGigDbObject() {
				var gigDbObject = {
					id: webPage.html.selection("gigViewerForm").dataset.dbId,
					venue: webPage.html.selection("gigVenueInput").value,
					date: webPage.html.selection("gigDateInput").value,
					start: webPage.html.selection("gigStartTimeInput").value,
					end: webPage.html.selection("gigEndTimeInput").value,
					invoice: getInvoice(),
					status: webPage.html.selection("gigStatusInput").value,
					reference: webPage.html.selection("gigReferenceNameInput").value,
					reference_email: webPage.html.selection("gigReferenceEmailInput").value,
					reference_telephone: webPage.html.selection("gigReferenceTelephoneInput").value,
					notes: webPage.html.selection("gigViewerNotesInput").value,
				};

				return gigDbObject;
			}

			function getInvoice() {
				var invoice = webPage.html.selection("gigInvoiceInput").value

				if (webPage.regex.nothing.test(invoice)) {
					invoice = 0;
				}

				return invoice;
			}

			function getInvalidRequiredFieldLabels() {
				var invalidRequiredFieldLabels = [];
				var requiredFieldInfo = {
					venue: {
						labelFor: "venue",
						dbValue: gigDbObject.venue,
					},
					date: {
						labelFor: "date",
						dbValue: gigDbObject.date,
					},
					start: {
						labelFor: "startTime",
						dbValue: gigDbObject.start,
					},
					end: {
						labelFor: "endTime",
						dbValue: gigDbObject.end,
					},
				};

				$.each(requiredFieldInfo, function (requiredFieldInfoKey, requiredFieldInfoObject) {
					if (webPage.regex.nothing.test(requiredFieldInfoObject.dbValue)) {
						invalidRequiredFieldLabels.push(requiredFieldInfoObject.labelFor);
					}
				});

				return invalidRequiredFieldLabels;
			}

			function gigInfoSaved(saveInfo) {
				showStatusDialog = {
					saved: saved,
					gigInfoExists: gigInfoExists,
					updated: updated,
				};

				showStatusDialog[saveInfo.status]();

				function saved() {
					webPage.updateUi({
						type: "dialogBox",
						modify: "showGigInfoSavedDialog",
					});

					webPage.html.selection("gigViewerForm").dataset.dbId = saveInfo.gigInfo.id;

					webPage.updateUi({
						type: "gigInfoRow",
						modify: "insertNewRow",
						gigInfo: saveInfo.gigInfo,
					});
				}

				function gigInfoExists() {
					webPage.updateUi({
						type: "dialogBox",
						modify: "showGigInfoExistsDialog",
					});
				}

				function updated() {
					webPage.updateUi({
						type: "dialogBox",
						modify: "showGigInfoUpdatedDialog",
					});

					webPage.updateUi({
						type: "gigInfoRow",
						modify: "updateGigRow",
						gigInfo: saveInfo.gigInfo,
					});
				}
			}

			function saveGigInfoError(xhr, status, strError) {
				console.log("Error saving the gig information:", strError);
			}
		}

		function publish() {
			webPage.updateUi({
				type: "dialogBox",
				modify: "showPublishDialog",
			});
		}

		function underlineInvalidRequiredFields() {
			$.each(webPage.html.selection("requiredLabels"), function (requiredLabelIndex, requiredLabel) {
				requiredLabel.style.borderBottomColor = "red";
			});
		}

		function removeInvalidRequiredFieldsUnderline() {
			$.each(webPage.html.selection("requiredLabels"), function (requiredLabelIndex, requiredLabel) {
				requiredLabel.style.borderBottomColor = "";
			});
		}
		
	}

	function dialogBox() {
		var modify = {
			showInvalidRequiredFieldsDialog: showInvalidRequiredFieldsDialog,
			showGigInfoExistsDialog: showGigInfoExistsDialog,
			showGigInfoUpdatedDialog: showGigInfoUpdatedDialog,
			showGigInfoSavedDialog: showGigInfoSavedDialog,
			showPublishDialog: showPublishDialog,
			showPublishWebPageDialog: showPublishWebPageDialog,
			showPublishExcelPageDialog: showPublishExcelPageDialog,
			publishWebPage: publishWebPage,
			publishWebPageCancel: publishWebPageCancel,
			noGigsForStartDate: noGigsForStartDate,
			displayDialog: displayDialog,
			previewPublishedWebsite: previewPublishedWebsite,
			hide: hide,
			generalHide: generalHide,
			closeExcelExporter: closeExcelExporter,
			toggleExcelExporterYear: toggleExcelExporterYear,
			exportGigInfoToExcelFormat: exportGigInfoToExcelFormat,
			openExcelFiles: openExcelFiles,
		};

		modify[info.modify]();

		function showInvalidRequiredFieldsDialog() {
			webPage.html.body.$dialogBox[0].innerHTML = webPage.html.innerHtml({type: "dialog", dialog: "invalidRequiredFields"})

			webPage.html.body.$dialogBox[0].style.visibility = "visible";

			webPage.updateUi({
				type: "gigViewerSection",
				modify: "removeInvalidRequiredFieldsUnderline"
			});

			webPage.event({
				type: "dialogBox",
				runEvent: "invalidRequiredFieldsDialog",
			});

			position();

			webPage.html.body.$dialogBox[0].style.opacity = 1;

			function position() {
				webPage.html.data.dialogBox.initialize();

				$(webPage.html.selection("invalidRequiredFieldsDialogAttentionFigure")).css({
					left: webPage.html.data.dialogBox.invalidRequiredFields.figure.position.left,
					top: webPage.html.data.dialogBox.invalidRequiredFields.figure.position.top,
				});

				$(webPage.html.selection("invalidRequiredFieldsDialogMessage")).css({
					left: webPage.html.data.dialogBox.invalidRequiredFields.message.position.left,
					top: webPage.html.data.dialogBox.invalidRequiredFields.message.position.top,
				});

				$(webPage.html.selection("invalidRequiredFieldsDialogButtonBox")).css({
					left: webPage.html.data.dialogBox.invalidRequiredFields.buttons.position.left,
					top: webPage.html.data.dialogBox.invalidRequiredFields.buttons.position.top,
				});

				$(webPage.html.selection("dialogBoxArticle")).css({
					width: webPage.html.data.dialogBox.invalidRequiredFields.dialog.size.width,
					height: webPage.html.data.dialogBox.invalidRequiredFields.dialog.size.height,
					left: webPage.html.data.dialogBox.invalidRequiredFields.dialog.position.left,
					top: webPage.html.data.dialogBox.invalidRequiredFields.dialog.position.top,
				});
			}
		}

		function showGigInfoExistsDialog() {
			webPage.html.body.$dialogBox[0].innerHTML = webPage.html.innerHtml({type: "dialog", dialog: "gigInfoExists"});

			webPage.html.body.$dialogBox[0].style.visibility = "visible";

			webPage.updateUi({
				type: "gigViewerSection",
				modify: "removeInvalidRequiredFieldsUnderline"
			});

			webPage.event({
				type: "dialogBox",
				runEvent: "gigInfoExistsDialog",
			});

			position();

			webPage.html.body.$dialogBox[0].style.opacity = 1;

			function position() {
				webPage.html.data.dialogBox.initialize();

				$(webPage.html.selection("gigInfoExistsDialogAttentionFigure")).css({
					left: webPage.html.data.dialogBox.gigInfoExists.figure.position.left,
					top: webPage.html.data.dialogBox.gigInfoExists.figure.position.top,
				});

				$(webPage.html.selection("gigInfoExistsDialogMessage")).css({
					left: webPage.html.data.dialogBox.gigInfoExists.message.position.left,
					top: webPage.html.data.dialogBox.gigInfoExists.message.position.top,
				});

				$(webPage.html.selection("gigInfoExistsDialogButtonBox")).css({
					left: webPage.html.data.dialogBox.gigInfoExists.buttons.position.left,
					top: webPage.html.data.dialogBox.gigInfoExists.buttons.position.top,
				});

				$(webPage.html.selection("dialogBoxArticle")).css({
					width: webPage.html.data.dialogBox.gigInfoExists.dialog.size.width,
					height: webPage.html.data.dialogBox.gigInfoExists.dialog.size.height,
					left: webPage.html.data.dialogBox.gigInfoExists.dialog.position.left,
					top: webPage.html.data.dialogBox.gigInfoExists.dialog.position.top,
				});
			}
		}

		function showGigInfoUpdatedDialog() {
			webPage.html.body.$dialogBox[0].innerHTML = webPage.html.innerHtml({type: "dialog", dialog: "gigInfoUpdated"});

			webPage.html.body.$dialogBox[0].style.visibility = "visible";

			webPage.updateUi({
				type: "gigViewerSection",
				modify: "removeInvalidRequiredFieldsUnderline"
			});

			webPage.event({
				type: "dialogBox",
				runEvent: "gigInfoUpdatedDialog",
			});

			position();

			webPage.html.body.$dialogBox[0].style.opacity = 1;

			function position() {
				webPage.html.data.dialogBox.initialize();

				$(webPage.html.selection("gigInfoUpdatedDialogSuccessFigure")).css({
					left: webPage.html.data.dialogBox.gigInfoUpdated.figure.position.left,
					top: webPage.html.data.dialogBox.gigInfoUpdated.figure.position.top,
				});

				$(webPage.html.selection("gigInfoUpdatedDialogMessage")).css({
					left: webPage.html.data.dialogBox.gigInfoUpdated.message.position.left,
					top: webPage.html.data.dialogBox.gigInfoUpdated.message.position.top,
				});

				$(webPage.html.selection("gigInfoUpdatedDialogButtonBox")).css({
					left: webPage.html.data.dialogBox.gigInfoUpdated.buttons.position.left,
					top: webPage.html.data.dialogBox.gigInfoUpdated.buttons.position.top,
				});

				$(webPage.html.selection("dialogBoxArticle")).css({
					width: webPage.html.data.dialogBox.gigInfoUpdated.dialog.size.width,
					height: webPage.html.data.dialogBox.gigInfoUpdated.dialog.size.height,
					left: webPage.html.data.dialogBox.gigInfoUpdated.dialog.position.left,
					top: webPage.html.data.dialogBox.gigInfoUpdated.dialog.position.top,
				});
			}
		}

		function showGigInfoSavedDialog() {
			webPage.html.body.$dialogBox[0].innerHTML = webPage.html.innerHtml({type: "dialog", dialog: "gigInfoSaved"});

			webPage.html.body.$dialogBox[0].style.visibility = "visible";

			webPage.updateUi({
				type: "gigViewerSection",
				modify: "removeInvalidRequiredFieldsUnderline"
			});

			webPage.event({
				type: "dialogBox",
				runEvent: "gigInfoSavedDialog",
			});

			position();

			webPage.html.body.$dialogBox[0].style.opacity = 1;

			function position() {
				webPage.html.data.dialogBox.initialize();

				$(webPage.html.selection("gigInfoSavedDialogSuccessFigure")).css({
					left: webPage.html.data.dialogBox.gigInfoSaved.figure.position.left,
					top: webPage.html.data.dialogBox.gigInfoSaved.figure.position.top,
				});

				$(webPage.html.selection("gigInfoSavedDialogMessage")).css({
					left: webPage.html.data.dialogBox.gigInfoSaved.message.position.left,
					top: webPage.html.data.dialogBox.gigInfoSaved.message.position.top,
				});

				$(webPage.html.selection("gigInfoSavedDialogButtonBox")).css({
					left: webPage.html.data.dialogBox.gigInfoSaved.buttons.position.left,
					top: webPage.html.data.dialogBox.gigInfoSaved.buttons.position.top,
				});

				$(webPage.html.selection("dialogBoxArticle")).css({
					width: webPage.html.data.dialogBox.gigInfoSaved.dialog.size.width,
					height: webPage.html.data.dialogBox.gigInfoSaved.dialog.size.height,
					left: webPage.html.data.dialogBox.gigInfoSaved.dialog.position.left,
					top: webPage.html.data.dialogBox.gigInfoSaved.dialog.position.top,
				});
			}
		}

		function showPublishDialog() {
			webPage.html.body.$dialogBox[0].innerHTML = webPage.html.innerHtml({type: "dialog", dialog: "gigInfoPublish"});

			webPage.html.body.$dialogBox[0].style.visibility = "visible";

			webPage.event({
				type: "dialogBox",
				runEvent: "gigInfoPublishDialog",
			});

			position();

			webPage.html.body.$dialogBox[0].style.opacity = 1;

			function position() {
				webPage.html.data.dialogBox.initialize();

				$(webPage.html.selection("gigInfoPublishDialogButtonBox")).css({
					left: webPage.html.data.dialogBox.gigInfoPublish.buttons.position.left,
					top: webPage.html.data.dialogBox.gigInfoPublish.buttons.position.top,
				});

				$(webPage.html.selection("dialogBoxArticle")).css({
					width: webPage.html.data.dialogBox.gigInfoPublish.dialog.size.width,
					height: webPage.html.data.dialogBox.gigInfoPublish.dialog.size.height,
					left: webPage.html.data.dialogBox.gigInfoPublish.dialog.position.left,
					top: webPage.html.data.dialogBox.gigInfoPublish.dialog.position.top,
				});
			}
		}

		function showPublishWebPageDialog() {
			webPage.updateUi({
				type: "dialogBox",
				modify: "hide",
			});

			setTimeout(function () {
				webPage.html.body.$dialogBox[0].innerHTML = webPage.html.innerHtml({type: "dialog", dialog: "gigInfoPublishWeb"});

				webPage.html.body.$dialogBox[0].style.visibility = "visible";

				webPage.event({
					type: "dialogBox",
					runEvent: "gigInfoPublishWebDialog",
				});

				position();

				webPage.html.body.$dialogBox[0].style.opacity = 1;

				function position() {
					webPage.html.data.dialogBox.initialize();

					$(webPage.html.selection("gigInfoPublishWebdialogBoxFigure")).css({
						left: webPage.html.data.dialogBox.gigInfoPublishWeb.figure.position.left,
						top: webPage.html.data.dialogBox.gigInfoPublishWeb.figure.position.top,
						width: webPage.html.data.dialogBox.gigInfoPublishWeb.figure.size.height,
						height: webPage.html.data.dialogBox.gigInfoPublishWeb.figure.size.height,
					});

					$(webPage.html.selection("gigInfoPublishWebDialogSection")).css({
						left: webPage.html.data.dialogBox.gigInfoPublishWeb.section.position.left,
						top: webPage.html.data.dialogBox.gigInfoPublishWeb.section.position.top,
					});

					$(webPage.html.selection("dialogBoxArticle")).css({
						width: webPage.html.data.dialogBox.gigInfoPublishWeb.dialog.size.width,
						height: webPage.html.data.dialogBox.gigInfoPublishWeb.dialog.size.height,
						left: webPage.html.data.dialogBox.gigInfoPublishWeb.dialog.position.left,
						top: webPage.html.data.dialogBox.gigInfoPublishWeb.dialog.position.top,
					});
				}
			}, 550);
		}

		function publishWebPage() {
			$.ajax({
				url: "/requestGigsToPublish/",
				dataType: "json",
				success: publishWebSite,
				error: requestGigsToPublishError,
				data: {
					publishWebStartDate: webPage.html.selection("gigInfoPublishDialogDateInput").value,
				},
			});

			function publishWebSite(gigsToPublish) {

				if (gigsToPublish) {
					publishGigGuide();
				} else {
					webPage.updateUi({
						type: "dialogBox",
						modify: "noGigsForStartDate"
					});
				}

				function publishGigGuide() {
					var gigGuideTable;

					gigGuideTable = webPage.html.innerHtml({
						type: "gigGuide",
						gigsToPublish: gigsToPublish,
					});

					$.ajax({
						url: "/publishWebPage/",
						dataType: "json",
						type: "POST",
						success: publishWebPage,
						error: publishWebPageError,
						data: {
							gigGuideTable: gigGuideTable,
						},
					});

					function publishWebPage(webPagePublicationInfo) {
						if (webPage.regex.published.test(webPagePublicationInfo.status)) {
							webPage.html.body.$dialogBox[0].style.opacity = 0;

							setTimeout(function () {
								webPage.html.body.$dialogBox[0].innerHTML = webPage.html.innerHtml({
									type: "dialog",
									dialog: "horizontalDialog",
									svg: "success",
									message: "Your web site has successfully been published.",
									button: "Preview",
								});

								webPage.event({
									type: "dialogBox",
									runEvent: "preveiwWebsite",
								});


								webPage.updateUi({
									type: "dialogBox",
									modify: "displayDialog",
									dialog: webPage.html.selection("horzontalDialogBox")
								});
							}, 550);
						}
					}

					function publishWebPageError(xhr, status, strError) {
						console.log("Error publishing the website:", strError);
					}
				}
			}

			function requestGigsToPublishError(xhr, status, strError) {
				console.log("Error retrieving gigs to publish:", strError);
			}
		}

		function publishWebPageCancel() {
			webPage.updateUi({
				type: "dialogBox",
				modify: "hide",
			});
		}

		function showPublishExcelPageDialog() {
			webPage.updateUi({
				type: "dialogBox",
				modify: "hide",
			});

			setTimeout(function () {
				$.ajax({
					url: "/requestGigYears/",
					success: openExcelExportDialog,
					error: requestGigYearsError,
				});
			}, 550);

			function openExcelExportDialog(gigYears) {
				if (gigYears) {
					webPage.html.body.$dialogBox[0].innerHTML = webPage.html.innerHtml({type: "dialog", dialog: "excelExporter", gigYears: JSON.parse(gigYears)});

					webPage.event({
						type: "dialogBox",
						runEvent: "excelExportDialog",
					});

					webPage.updateUi({
						type: "dialogBox",
						modify: "displayDialog",
						dialog: webPage.html.body.$dialogBox[0].firstChild,
					});
				}
			}

			function requestGigYearsError(xhr, status, strError) {
				console.log("Error retrieving gigs to publish:", strError);
			}
		}

		function noGigsForStartDate() {
			webPage.updateUi({
				type: "dialogBox",
				modify: "hide",
			});

			setTimeout(function () {
				webPage.html.body.$dialogBox[0].innerHTML = webPage.html.innerHtml({type: "dialog", dialog: "noGigsForStartDate"});

				webPage.html.body.$dialogBox[0].style.visibility = "visible";

				webPage.event({
					type: "dialogBox",
					runEvent: "noGigsForStartDate",
				});

				position();

				webPage.html.body.$dialogBox[0].style.opacity = 1;

				function position() {
					var dialogBoxSection = webPage.html.selection("dialogBoxSection");
					var dialogBoxArticle = webPage.html.selection("dialogBoxArticle");

					webPage.html.data.dialogBox.initialize();

					$(webPage.html.selection("dialogBoxFigure")).css({
						height: webPage.html.data.dialogBox.noGigsForStartDate.figure.size.height,
						width: webPage.html.data.dialogBox.noGigsForStartDate.figure.size.height,
						left: webPage.html.data.dialogBox.padding,
						top: webPage.html.data.dialogBox.padding,
					});

					$(dialogBoxSection).css({
						left: webPage.html.data.dialogBox.padding,
						top: webPage.html.data.dialogBox.padding,
					});

					$(dialogBoxArticle).css({
						width: dialogBoxSection.offsetLeft + dialogBoxSection.offsetWidth + (webPage.html.data.dialogBox.padding),
						height: dialogBoxSection.offsetHeight + (webPage.html.data.dialogBox.padding * 2),
					});

					$(dialogBoxArticle).css({
						left: webPage.html.data.dialogBox.getCenteredPosition(webPage.html.data.dialogBox.position.center.left, dialogBoxArticle.offsetWidth, "left"),
						top: webPage.html.data.dialogBox.getCenteredPosition(webPage.html.data.dialogBox.position.center.top, dialogBoxArticle.offsetHeight, "top"),
					});
				}
			}, 550);
		}

		function displayDialog() {
			webPage.html.body.$dialogBox[0].style.visibility = "visible";

			position();

			webPage.html.body.$dialogBox[0].style.opacity = 1;
			

			function position() {
				$(info.dialog).css({
					left: webPage.html.data.dialogBox.getCenteredPosition(webPage.html.data.dialogBox.position.center.left, info.dialog.offsetWidth, "left"),
					top: webPage.html.data.dialogBox.getCenteredPosition(webPage.html.data.dialogBox.position.center.top, info.dialog.offsetHeight, "top"),
				});
			}
		}

		function previewPublishedWebsite() {
			var webSiteTab = window.open("http://127.0.0.1:8000/Static/Assets/JameForbesWebsitTemplate/jameForbes.html", '_blank');

			webSiteTab.focus();

			webPage.updateUi({
				type: "dialogBox",
				modify: "generalHide",
			});
		}

		function hide() {
			webPage.html.body.$dialogBox[0].style.opacity = 0;

			setTimeout(function () {
				webPage.html.body.$dialogBox[0].style.visibility = "hidden";

				if (webPage.regex.invalidRequiredFields.test(webPage.html.selection("dialogBoxArticle").dataset.type)) {
					webPage.updateUi({
						type: "gigViewerSection",
						modify: "underlineInvalidRequiredFields"
					});
				}
			}, 550);
		}

		function generalHide() {
			webPage.html.body.$dialogBox[0].style.opacity = 0;

			setTimeout(function () {
				webPage.html.body.$dialogBox[0].style.visibility = "hidden";
			}, 550);
		}

		function closeExcelExporter() {
			webPage.updateUi({
				type: "dialogBox",
				modify: "generalHide",
			});
		}

		function toggleExcelExporterYear() {
			var excelExporterYearFigure = info.event.currentTarget.previousSibling;

			if (webPage.html.selection("excelExporterYearsSelected").length > 1 || webPage.regex.false.test(excelExporterYearFigure.dataset.selected)) {
				if (webPage.regex.true.test(excelExporterYearFigure.dataset.selected)) {
					excelExporterYearFigure.dataset.selected = false;
				} else {
					excelExporterYearFigure.dataset.selected = true;
				}
			}
		}

		function exportGigInfoToExcelFormat() {
			$.ajax({
				url: "/exportGigInfoToExcelFormat/",
				type: "POST",
				dataType: "json",
				success: confirmExportToExcelFormat,
				error: exportGigInfoToExcelFormatError,
				data: getExportYearsObject(),
			});

			function getExportYearsObject() {
				var exportYearsObject = {};

				$.each(webPage.html.selection("excelExporterYearsSelectedText"), function (yearIndex, year) {
					exportYearsObject[yearIndex] = year;
				});

				return exportYearsObject;
			}

			function confirmExportToExcelFormat(excelFiles) {
				setExcelFilesData();

				webPage.html.body.$dialogBox[0].style.opacity = 0;

				function setExcelFilesData() {
					webPage.html.data.excelFiles = {};

					$.each(excelFiles, function (excelFileIndex, excelFile) {
						webPage.html.data.excelFiles[excelFileIndex] = excelFile;
					});
				}

				setTimeout(function () {
					webPage.html.body.$dialogBox[0].innerHTML = webPage.html.innerHtml({
						type: "dialog",
						dialog: "horizontalDialog",
						svg: "success",
						message: "Your annual gig information has successfully been exported.",
						button: "Open",
					});

					webPage.event({
						type: "dialogBox",
						runEvent: "openExcelFiles",
					});

					webPage.updateUi({
						type: "dialogBox",
						modify: "displayDialog",
						dialog: webPage.html.selection("horzontalDialogBox")
					});
				}, 550);
			}

			function exportGigInfoToExcelFormatError(xhr, status, strError) {
				console.log("Error publishing the website:", strError);
			}
		}

		function openExcelFiles() {
			$.ajax({
				url: "/openExportedExcelFiles/",
				dataType: "json",
				success: webPage.html.doNothing,
				error: openExcelFilesError,
				data: webPage.html.data.excelFiles,
			});
			
			webPage.updateUi({
				type: "dialogBox",
				modify: "generalHide",
			});

			function openExcelFilesError(xhr, status, strError) {
				console.log("Error publishing the website:", strError);
			}
		}
	}

	function metricElement() {
		var dimensions = {};
		var modify = {
			square: square,
		};

		modify[info.modify]();

		function square() {
			$(webPage.html.selection("metricElement")).css({
				width: info.width,
				height: info.width,
			});
		}
	}
};