// Multi-Column Articles Script
// Version 0.5.1
// Copyright (c) 2009, Raking Leaves
// Released under the GPL license
// http://www.gnu.org/copyleft/gpl.html
//
// Includes code from Hyphenator, distributed under GPL v3.
// See http://code.google.com/p/hyphenator/
//
// TODO
// ----
// - fix Boston Review (Firefox 3)
// - add St. Petersburg Times support
// - Esquire, Mother Jones, New Republic
//
// Changelog
// ---------
// 0.5.1:
//   - Small fixes for NYTimes and The Atlantic.
// 0.5.0:
//   - Added hyphenation, via the hyphenator script.  Hyphenation requires Firefox 3.
//   - Support for SFGate and The Economist.
//   - Support for BBC News, ABC News, Newsweek, and Time, contributed by ihq.
//   - Fixes for Wall Street Journal, Washington Post.
// 0.4.1:
//   - Fixed Washington Post.
// 0.4.0:
//   - Added ability to use custom style for paragraphs.
//   - Added outer margin, as suggested by neetij.
//   - Other small fixes.
// 0.3.5:
//   - Fixed bugs in calculating height of column text.  
//     Hopefully, columns will now be appropriately sized to
//     avoid vertical scrolling.
//   - Added initial support for Wikipedia.
// 0.3.0:
//   - Overhaul of scrolling implementation.  Various bugs
//     like text slightly off the page or too few pages should
//     be (mostly) fixed.  Occasionally, there will now be an 
//     extra blank page; this is a known issue.
//   - Fixed Boston Review.   
// 0.2.1:
//   - Added support for The Guardian.
//   - Small fix for The Atlantic.
// 0.2:
//   - Add option to disable smooth scrolling.
//   - Disable prev and next buttons when appropriate.
//   - Minor fixes for sites.
// 0.1.8:
//   - Support for Foreign Affairs.
//   - Small fix for Mac.
// 0.1.7:
//   - Support for Wall Street Journal.
// 0.1.6.1:
//   - Small fix for Washington Post.
// 0.1.6:
//   - Support for Wired, contributed by Liam
// 0.1.5:
//   - Support for Slate
//   - Support for Seattle Times
// 0.1.4:
//   - Support for San Jose Mercury News, contributed
//     by Tracy Logan.
// 0.1.3:
//   - Improved aesthetics, contributed by Dave.
// 0.1.2:
//   - Added support for New York Magazine.
// 0.1.1: 
//   - Made text justified, which looks better
//     to me for narrow columns.  I may change 
//     this back if anyone complains.
// 0.1:
//   - Initial release
//
// ==UserScript==
// @name          Multi-column articles
// @namespace     http://diveintomark.org/projects/greasemonkey/
// @description   Multi-column articles for several publications
// @include       *nytimes.com*/*pagewanted=print*
// @include       http://*.nybooks.com/articles/*
// @include       http://*.newyorker.com/*printable=true*
// @include       http://*.washingtonpost.com/*pf.html
// @include       http://*.latimes.com/*,print.*
// @include       http://*.boston.com/*mode=PF*
// @include       http://*bostonreview.net/BR*
// @include       http://*theatlantic.com/doc/print*
// @include       http://*.printthis.clickability.com/pt/*nymag.com*
// @include       http://*.mercurynews.com/portlet/article/html/fragments/print_article.jsp?*
// @include       http://*.slate.com/*action=print*
// @include       http://seattletimes.nwsource.com/*PrintStory.pl*
// @include	  http://*.wired.com/*print*
// @include       http://*.wsj.com/*/article_print*
// @include       http://*.foreignaffairs.org/*mode=print*
// @include       http://*.guardian.co.uk/print*
// @include       http://*.wikipedia.org/*printable=yes*
// @include       http://*.sfgate.com/cgi-bin/article.cgi*type=printable*
// @include       http://*.economist.com/*/PrinterFriendly.cfm*
// @include       http://*.bbc.co.uk/*/pagetools/print/*
// @include       *abcnews.go.com/print?id=*
// @include       http://*.newsweek.com/*/output/print
// @include       http://*.time.com/*/printout/*
// ==/UserScript==

// 
// UTILITY FUNCTIONS
//

// edit the global style of a document 
// from Dive Into Greasemonkey
function addGlobalStyle(css) {
    var head, style;
    head = document.getElementsByTagName('head')[0];
    if (!head) { return; }
    style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    head.appendChild(style);
}

// from the web; compute the absolute position of an
// element
function getAbsolutePosition(element) {
    var r = { x: element.offsetLeft, y: element.offsetTop };
    if (element.offsetParent) {
      var tmp = getAbsolutePosition(element.offsetParent);
      r.x += tmp.x;
      r.y += tmp.y;
    }
    return r;
}
// get all the elements of a particular class
function getElementsByClass(searchClass,node,tag) {
	var classElements = new Array();
	if ( node == null )
		node = document;
	if ( tag == null )
		tag = '*';
	var els = node.getElementsByTagName(tag);
	var elsLen = els.length;
	var pattern = new RegExp("(^|\\s)"+searchClass+"(\\s|$)");
	for (i = 0, j = 0; i < elsLen; i++) {
		if ( pattern.test(els[i].className) ) {
			classElements[j] = els[i];
			j++;
		}
	}
	return classElements;
}

// takes all the child nodes of parentNode and
// makes them children of a new div, which itself
// is made a child of parentNode
// @return the new div
function addChildrenToNewDiv(parentNode) {
    var dummyDiv = document.createElement('div');
    parentNode.appendChild(dummyDiv);
    for (var i = 0; i < parentNode.childNodes.length; i++) {
        if (parentNode.childNodes[i] != dummyDiv) {
            dummyDiv.appendChild(parentNode.childNodes[i].cloneNode(true));
        }
    }
    var kids = parentNode.childNodes;
    for (var j = kids.length - 1; j >= 0; j--) {
        if (kids[j] != dummyDiv) {
            parentNode.removeChild(kids[j]);
        }
    }
    return dummyDiv;
}

// removes a node from the DOM if it
// is not null
function removeIfNotNull(n) {
    if (n != null) {
        n.parentNode.removeChild(n);
    }
}

// remove all nodes in array from DOM
function removeAll(theNodes) {
    for (var i = theNodes.length - 1; i >= 0; i--) {
        removeIfNotNull(theNodes[i]);
    }
}

// make a button with some click handler and label
function makeButton(onClickHandler, theLabel) { 
	var theButton = document.createElement('input');
	theButton.type = "button";
	theButton.addEventListener('click', onClickHandler, true);
	theButton.value = theLabel;
	return theButton;		
}

// 
// stored preferences
//

// whether to use smooth scrolling
var smoothScrollProp = "smoothscroll";
var useSmoothScroll = GM_getValue(smoothScrollProp,false);

// whether to use custom style
var customStyleProp = "customstyle";
var useCustomStyle = GM_getValue(customStyleProp,false);

// details of custom style
var extraStyleProp = "extrastyle";
var customFontFamily = "\"Times New Roman\",Times,serif";
var defaultExtraStyle = 
  "p { font-size: 14px ! important; \n" +
  "    line-height: 1.3em ! important; \n" + 
  "    padding-bottom: 1em ! important; \n" + 
  "    font-family: " + customFontFamily + " ! important; \n" +
  "    font-size-adjust: none ! important; \n" + 
  "    font-style: normal ! important; \n" + 
  "    font-variant: normal ! important; \n" +
  "    font-weight: normal ! important; \n" + 
  "    padding-top: 8pt ! important; \n" + 
  "    padding-bottom: 8pt ! important; \n" +
  "    margin: 0pt ! important; \n" +
  "    text-indent: 0pt ! important; \n" +
  "}";
var extraStyle = GM_getValue(extraStyleProp,defaultExtraStyle); 

//
// key DOM nodes for scrolling interface
//

var innerFrameID = 'articletext';
var pageNumDivID = 'pageNum';
var nextButton;
var prevButton;

//
// state for scrolling and pagination
//

// offsets for each page
var pageOffsets;
// the current page
var curPageNum = 1;
// total number of pages
var numPages;
// is a smooth scroll in progress?
var currentlyScrolling = false;
// amount scrolled in the current smooth scroll
var scrolledThusFar;
// total amount to smooth scroll
var totalScroll;
// how much to scroll in each increment of a smooth scroll
var scrollIncr;

// 
// scrolling code
//

// update the displayed page number, and disable
// navigation buttons if necessary
function update_page_num() {
    document.getElementById(pageNumDivID).innerHTML = "Page " + curPageNum + " / " + numPages;
    if (curPageNum == 1) {
        prevButton.setAttribute('disabled',"disabled");
    } else {
        prevButton.disabled = null;
    }
    if (curPageNum == numPages) {
        nextButton.setAttribute('disabled',"disabled");
    } else {
        nextButton.disabled = null;
    }
}

// scroll left or right by one increment
function do_smooth_scroll(right) {
    if (scrolledThusFar < totalScroll) {
        var amountToScroll = Math.min(scrollIncr, totalScroll - scrolledThusFar);
        if (right) {
            document.getElementById(innerFrameID).scrollLeft += amountToScroll;
        } else {
            document.getElementById(innerFrameID).scrollLeft -= amountToScroll;
        }            
        scrolledThusFar += amountToScroll;
        window.setTimeout(function() { do_smooth_scroll(right); }, 30);
    } else {
        window.clearTimeout();
        currentlyScrolling = false;
    }
}

function do_fast_scroll() {
	document.getElementById(innerFrameID).scrollLeft = pageOffsets[curPageNum-1];
    currentlyScrolling = false;
}

// scroll to the next page
function scroll_next() {
    if (!currentlyScrolling && curPageNum < numPages) {
        currentlyScrolling = true;
        curPageNum++;
        update_page_num();
        if (useSmoothScroll) {
            scrolledThusFar = 0;
            totalScroll = pageOffsets[curPageNum-1] - document.getElementById(innerFrameID).scrollLeft;
            do_smooth_scroll(true);
        } else {
            do_fast_scroll();
        }
    }

}

// scroll to the previous page
function scroll_prev() {
    if (!currentlyScrolling && curPageNum > 1) {
        currentlyScrolling = true;
        curPageNum--;
        update_page_num();
        if (useSmoothScroll) {
            scrolledThusFar = 0;
            totalScroll = document.getElementById(innerFrameID).scrollLeft - pageOffsets[curPageNum-1];
            do_smooth_scroll(false);
        } else {
            do_fast_scroll();
        }
    }
}

// handle keyboard shortcuts
function pressedKey(e) {
    if (e.altKey) return;
    if (e.ctrlKey) return;
    // this should handle command key on mac
    if (e.metaKey) return;
    var code = e.keyCode;
    if (code == 37) { // left arrow
        scroll_prev();
    } else if (code == 39) { // right arrow
        scroll_next();
    }
}

// 
// defaults for column width and height
//

var columnWidthEm = 20;
var frameHeightEm = 45;
var columnHeightEm = frameHeightEm - 2;
var columnGapEm = 2;

// calculate the number of columns that fit
// in the given width (in pixels)
// NOTE: this function is *broken* for some cases,
// not sure why.  I think it returns a number greater
// than the actual number of columns, which makes
// things work (for now)
function columnsInWidth(width, theFontSize) {
    // lame!  re-do this as a closed form
    // calculation
    var gapPix = columnGapEm*theFontSize;
    var minColPix = columnWidthEm*theFontSize;
    var rawRatio = (width+gapPix) / (gapPix+minColPix);
//    GM_log("raw ratio is " + rawRatio);
    var numColumns = parseInt(rawRatio);
    return numColumns;
}

// calculate actual offsets of each page,
// using the offsetLeft DOM property of paragraphs
// ASSUMES: text paragraphs are actually nested in <p> elements
function calculateOffsetsNew(theText, screenWidth) {

    // function to compute median column width, used in
    // cases where paragraphs span many columns
	var computeMedianColumnWidth = function(theText) {
		var diffs = new Array();
		var lastOffset = -10000000;
		var theTextOffset = theText.offsetLeft;
		var paras = document.evaluate('//p|//div[@id=\'brpadding\']', theText, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
		var curPara = paras.iterateNext();
		var diffInd = 0;
		while (curPara) {
			if (typeof(curPara.offsetLeft) != "undefined") {
				var curOffset = curPara.offsetLeft - theTextOffset;
				if (curOffset > lastOffset) { // fudge factor
					//GM_log("offset for next column is " + curOffset);
					if (lastOffset != -10000000) {
						diffs[diffInd] = curOffset - lastOffset;
						diffInd++;
					}
					lastOffset = curOffset;
				}		
			}		
			curPara = paras.iterateNext();		
		}
		// compute the median
		var median = 0;
		diffs.sort(function(a,b) { return a-b;});
		if (diffs.length%2 == 1) {
			median = diffs[parseInt(diffs.length/2)];
		} else {
			var mid = parseInt(diffs.length / 2);
			median = (diffs[mid] + diffs[mid-1]) / 2;
		}
		//GM_log("median column width is " + median);
		return median;
	}
	var medianColumnWidth = computeMedianColumnWidth(theText);
	var offsets = new Array();
	var curPage = 0;
	var lastOffset = -10000000;
	var theTextOffset = theText.offsetLeft;
	var debug = false;
	var setNextPageOffset = function(nextOffset) { 
		if (debug) {
			GM_log('setting offset of page ' + (curPage+1) + " to " + nextOffset);
		}
		offsets[curPage] = nextOffset;
		curPage++;
		
	};
	if (debug) {
		GM_log("offset of the text: " + theTextOffset);
	}
	// count the padding at the end as a "paragraph", to properly
	// handle final columns
	var paras = document.evaluate('//p|//div[@id=\'brpadding\']', theText, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
	var curPara = paras.iterateNext();
	while (curPara) {
		if (typeof(curPara.offsetLeft) != "undefined"
		    && curPara.parentNode.tagName != 'BLOCKQUOTE') { // bit of a hack...
			var curOffset = curPara.offsetLeft - theTextOffset;
			if (debug) {
				GM_log("cur para offset: " + curPara.offsetLeft);
				GM_log("cur para absolute offset: " + getAbsolutePosition(curPara).x);
			}
			if (curOffset > lastOffset) {
				if (debug) {
					GM_log("offset for next column is " + curOffset);
				}
				if (curPage == 0 || (curOffset - offsets[curPage-1]) >= screenWidth) {
					if (curPage != 0) { 
						var ratioToMedian = (curOffset - lastOffset) / medianColumnWidth;
						if (ratioToMedian > 1.5) {
							// get the number of columns that the
							// paragraph spans
							var numColumnsSpanned = Math.round(ratioToMedian);
							// compute approximate offsets for each column,
							// updating page offset when needed
							var tmpOffset = lastOffset;
							for (var i = 0; i < numColumnsSpanned - 1; i++) {
								tmpOffset += medianColumnWidth;
								if (tmpOffset - offsets[curPage-1] >= screenWidth) {
									setNextPageOffset(tmpOffset);
								}
							}
							// finally, check current column again
							if (curOffset - offsets[curPage - 1] >= screenWidth) {
								setNextPageOffset(curOffset);
							}
						} else {
							// normal page update
							setNextPageOffset(curOffset);
						}						
					} else {
						// first page
						// TODO clean up logic
						setNextPageOffset(curOffset);
					}
				}
				lastOffset = curOffset;
			}		
		}		
		curPara = paras.iterateNext();
	}
	return offsets;
}

// compute the font size style attribute for paragraphs
// within the multi-column view
function computeParaFontSize(theText) {
	// create a dummy paragraph, to figure out its computed style
	var dummyPara = document.createElement("p");
	theText.appendChild(dummyPara);
	var computedSize = document.defaultView.getComputedStyle(dummyPara, "").getPropertyValue("font-size").replace(/px/,"");
//	GM_log("computed para size " + computedSize);
	theText.removeChild(dummyPara);
	return computedSize;	 		
}

// 
// code for style customization
//


// calls a function specific to each site to
// get a div holding the article text
function getArticleText() {
    var theURL = document.URL;
    if (theURL.match(/nytimes\.com/)) {
        return getTextNYTimes();
    } else if (theURL.match(/nybooks\.com/)) {
        return getTextNYBooks();
    } else if (theURL.match(/newyorker\.com/)) {
        return getTextNewYorker();
    } else if (theURL.match(/washingtonpost\.com/)) {
        return getTextWashPost();
    } else if (theURL.match(/latimes\.com/)) {
        return getTextLATimes();
    } else if (theURL.match(/boston\.com/)) {
        return getTextBosGlobe();
    } else if (theURL.match(/bostonreview\.net/)) {
        return getTextBosReview();
    } else if (theURL.match(/theatlantic\.com/)) {
        return getTextAtlantic();
    } else if (theURL.match(/nymag\.com/)) {
        return getTextNYMag();
    } else if (theURL.match(/mercurynews\.com/)) {
        return getTextMercuryNews();
    } else if (theURL.match(/slate\.com/)) {
        return getTextSlate();
    } else if (theURL.match(/seattletimes\.nwsource\.com/)) {
        return getTextSeattleTimes();
    } else if (theURL.match(/wired\.com/)) {
	return getTextWired();
    } else if (theURL.match(/wsj\.com/)) {
        return getTextWSJ();
    } else if (theURL.match(/foreignaffairs\.org/)) {
        return getTextForeignAffairs();
    } else if (theURL.match(/guardian\.co\.uk/)) {
        return getTextGuardian();
    } else if (theURL.match(/wikipedia\.org/)) {
    	return getTextWikipedia();
    } else if (theURL.match(/sfgate\.com/)) {
        return getTextSFGate();
    } else if (theURL.match(/economist\.com/)) {
        return getTextEconomist();
    } else if (theURL.match(/bbc\.co\.uk/)) {
        return getTextBBCNews();
    } else if (theURL.match(/abcnews\.go\.com/)) {
        return getTextABCNews();
    } else if (theURL.match(/newsweek\.com/)) {
        return getTextNewsweek();
    } else if (theURL.match(/time\.com/)) {
        return getTextTime();
    }

}


// the getText*() functions should
// (1) return a div D containing the article text, such that
// D is a child of the document.body node, and
// (2) reformat the page as needed to make the scrolling
// view work properly

function getTextTime() {
    removeIfNotNull(document.getElementById('topBannerWrap'));
    removeAll(getElementsByClass('button',null,null));
    addGlobalStyle('.contentMain { padding: 0 0 0 0; }');
    addGlobalStyle('.tout1 p { line-height:1.3em ! important; }');
    addGlobalStyle('h1 { text-align:left; }');
    addGlobalStyle('.tout1 { border:0; }');
    addGlobalStyle('#footer { margin-top:0; }');
    removeAll(getElementsByClass('find'));
    return getElementsByClass('tout1',null,null)[0]
}
function getTextNewsweek() {
    addGlobalStyle("img {margin: 0 0 0 0;}");  
    // TO DO: remove p tag from deck div (subtitle) so the style isn't overwritten
    addGlobalStyle(".author { padding: 5px 0 0 0; }");
    addGlobalStyle(".articleUpdated { margin: 0 0 0 0; }");
    addGlobalStyle(".contentWrapper { margin: 0 0 0 0; width: 100%; padding-top:0 }");
    removeAll(getElementsByClass('copyright'));
    removeAll(getElementsByClass('hr'));
    removeAll(getElementsByClass('URL'));
    return getElementsByClass('body', document.body, 'div')[0];
}

function getTextABCNews() {
    addGlobalStyle("h1,h2,h3,h4 { font-family: sans-serif; text-align: left; }");
    return document.getElementById('content');
}

function getTextBBCNews() {
    addGlobalStyle("body { padding-left: 0; padding-right: 0; }");
    addGlobalStyle("div.headline { text-align: left; }");
    removeAll(getElementsByClass('ibox',null,null));
    return addChildrenToNewDiv(document.body);
}

function getTextEconomist() { 
    removeAll(document.body.getElementsByTagName('TABLE'));
    var theText = addChildrenToNewDiv(document.body);
    // fix stupid wrapping of paragraph text in font tags
    for (var i = 0; i < theText.childNodes.length; i++) {
    	if (theText.childNodes[i].tagName == 'P') {
    		var curPara = theText.childNodes[i];
	    	var firstChild = curPara.childNodes[0];
    		if (firstChild != null) {
    			if (firstChild.tagName == 'FONT') {
    				curPara.replaceChild(firstChild.childNodes[0], firstChild);
    			}
    		}
    	}
    }
    return theText;
}
function getTextSFGate() {
    var theText = document.getElementById('articlebody');
    removeIfNotNull(document.getElementById('adpos3'));
    return addChildrenToNewDiv(theText);
}
function getTextWikipedia() {
	removeAll(getElementsByClass('box',null,null));
	//removeAll(getElementsByClass('metadata',null,null));
	removeAll(getElementsByClass('infobox',null,null));
	removeAll(getElementsByClass('navbox',null,null));
	removeAll(getElementsByClass('references-small',null,null));
	removeAll(getElementsByClass('prettytable',null,null));
	removeAll(getElementsByClass('multivideolist',null,null));	
	removeAll(getElementsByClass('tright',null,null));
	removeAll(getElementsByClass('tleft',null,null));
	removeAll(getElementsByClass('wikitable',null,null));
	removeIfNotNull(document.getElementById('toc'));	
	//removeIfNotNull(document.getElementById('catlinks'));
	if (useCustomStyle) {
		addGlobalStyle("ul { font-family: " + customFontFamily + " ! important; }");
	}
	return document.getElementById('bodyContent');
}

function getTextGuardian() {
    removeAll(document.body.getElementsByTagName('IFRAME'));
    var theText = addChildrenToNewDiv(document.body);
    // fix stupid wrapping of paragraph text in font tags
    for (var i = 0; i < theText.childNodes.length; i++) {
    	if (theText.childNodes[i].tagName == 'P') {
    		var curPara = theText.childNodes[i];
	    	var firstChild = curPara.childNodes[0];
    		if (firstChild != null) {
    			if (firstChild.tagName == 'FONT') {
    				curPara.replaceChild(firstChild.childNodes[0], firstChild);
    			}
    		}
    	}
    }
    return theText;    
}
function getTextForeignAffairs() {
    removeAll(document.body.getElementsByTagName('HR'));
    return addChildrenToNewDiv(document.body);
}
function getTextWSJ() {
    var theText = getElementsByClass('articleTitle', null, null)[0].parentNode;
    removeIfNotNull(theText.childNodes[1]);
    removeAll(theText.getElementsByTagName('IMG'));
    removeAll(theText.getElementsByTagName('TABLE'));
    removeIfNotNull(document.getElementById('inset'));
    // sometimes there are two DOM nodes with the same id?
    removeIfNotNull(document.getElementById('inset'));
    return addChildrenToNewDiv(theText);
}

function getTextWired() {
    removeIfNotNull(document.getElementById('pic'));
    document.body.setAttribute("style", "width:auto;");
    removeAll(getElementsByClass("left_rail",null,null));
    var theText = document.getElementById('article_text');
    return addChildrenToNewDiv(theText);
}

function getTextSeattleTimes() {
    removeIfNotNull(getElementsByClass('photos', null, null)[0]);
    return addChildrenToNewDiv(document.body);
}

function getTextSlate() {
    return addChildrenToNewDiv(document.body);
}

function getTextMercuryNews() {
    var theText = getElementsByClass('articleBody', null, 'td')[0];
    return addChildrenToNewDiv(theText);
}

function getTextNYMag() {
    var mainDiv = document.getElementById('main');
    removeAll(mainDiv.getElementsByTagName('TABLE'));
    removeAll(getElementsByClass('page-navigation', mainDiv, null));
    return mainDiv;
}
function getTextAtlantic() {
    // remove forms
    //removeAll(document.body.getElementsByTagName('FORM'));
    //removeAll(document.body.getElementsByTagName('IMG'));
    //removeAll(document.body.getElementsByTagName('EMBED'));
    document.getElementById('container').setAttribute("style", "width:auto;");
    removeIfNotNull(document.getElementById('header'));
    removeAll(getElementsByClass('leaderboard-ad',null,null));
    removeAll(getElementsByClass('BrightcoveExperience',null,null));
    removeIfNotNull(document.getElementById('copyright'));
    return document.getElementById('storytop');
}

function getTextBosReview() {
//	removeIfNotNull(document.getElementById('top'));
//	removeIfNotNull(document.getElementById('headband'));
	removeIfNotNull(document.getElementById('left_column'));
	removeIfNotNull(document.getElementById('right_column'));
	removeIfNotNull(document.getElementById('footer'));
	document.getElementById('total').style.width="95%";
	document.getElementById('content').style.padding = null;
	var theText = document.getElementById('center_column_article');
	theText.style.width = "100%";
	theText.style.padding = "0px 0px 0px";	
	var commentStyle = ".c5t_comment_form_background { width: 100% !important; } .content {width: 100% !important; }";
	addGlobalStyle(commentStyle);
	removeAll(theText.getElementsByTagName("FORM"));
    return theText;
}

function getTextBosGlobe() {
    var possibleDivs = getElementsByClass('story', null, 'div');
    if (possibleDivs.length != 1) {
        alert("weird");
    }
    var theText = possibleDivs[0];
    return theText;
}
function getTextLATimes() {
    var theText = document.body.childNodes[5];
    theText.setAttribute("style", "");
    removeIfNotNull(theText.getElementsByTagName("A")[0]);
    // no idea why, but these HR elements mess things up
    removeAll(document.body.getElementsByTagName("HR"));
    // make the paragraphs actually appear in <p> elements    
    // first, find the paragraphs
    var parInds = new Array();
    var tmpInd = 0;
    for (var i = 0; i < theText.childNodes.length - 2; i++) {
    	if (theText.childNodes[i].nodeType == 3) {
    		var nodeVal = theText.childNodes[i].nodeValue;
    		if (nodeVal.match(/(.*)[a-zA-Z0-9](.*)/)) {
    			GM_log("found para at index " + i);
    			parInds[tmpInd] = i;
    			tmpInd++;
    		}
    	}
    }
    // stick them in <p> elements    
    for (var i = parInds.length-1; i >= 0; i--) {
    	var curParInd = parInds[i];
    	var theParaText = theText.childNodes[curParInd];
    	var newPara = document.createElement('p');
    	theText.replaceChild(newPara, theParaText);
    	newPara.appendChild(theParaText);
    }
    // remove BR elements
    removeAll(theText.getElementsByTagName("BR"));
    return theText;
}


function getTextWashPost() {
    var theText;
    var articleChildren = document.getElementById('PageArticlePrinterFriendly').childNodes;
    for (var i = articleChildren.length - 1; i >= 0; i--) {
        if (articleChildren[i].tagName == 'DIV') {
            theText = articleChildren[i];
            break;
        }
    }
    removeIfNotNull(theText.getElementsByTagName("FORM")[0]);
    var comments = document.getElementById('ArticleCommentsWrapper');
    if (comments) {
        // removing causes Javascript errors,
        // and making invisible exposes rendering bugs
        //comments.style.visibility = "hidden";
    }
    removeIfNotNull(document.getElementById('articleCopyright'));
    return theText;
}

function getTextNYTimes() {
    var theText = document.getElementById('articleBody');
    theText.id = null;
    removeIfNotNull(document.getElementById('articleInline'));
    removeAll(getElementsByClass('printInfo',null,null));
    removeAll(theText.getElementsByTagName("OBJECT"));
    return theText;
}

function getTextNYBooks() {
    var theText = document.getElementById('center-content');
    theText.id = null;
    var spans = theText.getElementsByTagName("SPAN");
    for (var i = 0; i < spans.length; i++) {
        if (spans[i].className == 'ad') {
            theText.removeChild(spans[i]);
        }
    }
    var page = document.getElementById('page');
    page.setAttribute("style","width:auto;");
    removeIfNotNull(document.getElementById('right-content'));
    return theText;
}

function getTextNewYorker() {
    var theText = document.getElementById('printbody');
    removeIfNotNull(document.getElementById('articleRail'));
    document.body.setAttribute("style", "width:auto;");
    return theText;
}


// 
// BEGIN MAIN CODE
//

var theText = getArticleText();

if (theText) {
    if (useCustomStyle) {
    	addGlobalStyle(extraStyle);
    } else {
    	// add this to fix scrolling
    	addGlobalStyle("p { margin: 0pt ! important; padding-top: 8pt ! important; padding-bottom: 8pt ! important; }");
    }
    // set the language to en, for hyphenation code
    document.getElementsByTagName('html')[0].setAttribute('lang','en');
    // create the div for the article
    var articleTextDiv = document.createElement("div");
    articleTextDiv.setAttribute("id", innerFrameID);
    articleTextDiv.setAttribute("name", innerFrameID);
    articleTextDiv.setAttribute("class","hyphenate");
    var overallWidth = "100%;";
	articleTextDiv.setAttribute("style", "overflow:hidden;width:" + overallWidth + "margin:0 auto;");
    
    // create navigation bar: prev / next button and page count
	prevButton = makeButton(scroll_prev, "Prev page");
    var prevButtonDiv = document.createElement('div');
    prevButtonDiv.setAttribute("style", "float:left; margin-left:10px;");
    prevButtonDiv.appendChild(prevButton);
    nextButton = makeButton(scroll_next, "Next page");
    var nextButtonDiv = document.createElement('div');
    nextButtonDiv.setAttribute("style", "float:right; margin-right:10px;");
    nextButtonDiv.appendChild(nextButton);
    var pageNum = document.createElement('div');
    pageNum.setAttribute("id", pageNumDivID);
    pageNum.setAttribute("style", "width:auto;margin:0 auto;text-align:center;");
    
    // create smooth scrolling checkbox
    var smoothScrollCheckDiv = document.createElement('div');
    smoothScrollCheckDiv.innerHTML = "<form name=\"blah\"><input type=\"checkbox\" name=\"smooth\"/>  Smooth scrolling</form>";
    smoothScrollCheckDiv.setAttribute("style", "position: relative; float:right; margin-right:10px; top: -16px; ");
    var checkboxInput = smoothScrollCheckDiv.getElementsByTagName("INPUT")[0];
    checkboxInput.checked = useSmoothScroll;
    checkboxInput.addEventListener('click', function() { useSmoothScroll = checkboxInput.checked; GM_setValue(smoothScrollProp, useSmoothScroll); }, true);
    
    // create custom style checkbox
    var customStyleCheckDiv = document.createElement('div');
    customStyleCheckDiv.innerHTML = "<form name=\"blah2\"><input type=\"checkbox\" name=\"customstyle\"/>  Custom style (<a href=\"#\" id=\"openEditLink\">edit</a>)</form>";
    customStyleCheckDiv.setAttribute("style", "position: relative; float:right; margin-right:10px; top: -16px; ");
    var styleCheckboxInput = customStyleCheckDiv.getElementsByTagName("INPUT")[0];
    styleCheckboxInput.checked = useCustomStyle;
    styleCheckboxInput.addEventListener('click', function() { useCustomStyle = styleCheckboxInput.checked; GM_setValue(customStyleProp, useCustomStyle); }, true);
    
	// create navigation bar, including prev/next buttons and checkboxes    
    var navigationDiv = document.createElement("div");
    navigationDiv.setAttribute("id", "navigationbuttons");
    navigationDiv.setAttribute("style", "position: relative; width:" + overallWidth + "padding-top: 2em;");    
    navigationDiv.appendChild(prevButtonDiv);
    navigationDiv.appendChild(nextButtonDiv);
    navigationDiv.appendChild(pageNum);
    navigationDiv.appendChild(smoothScrollCheckDiv);
    navigationDiv.appendChild(customStyleCheckDiv);

    // connect article div and navigation buttons
    var artAndButtons = document.createElement("div");
    artAndButtons.setAttribute("id", "articleandnav");
    artAndButtons.setAttribute("style", "padding-left: 10pt; padding-right: 10pt; width: auto; ");
    artAndButtons.appendChild(articleTextDiv);
    artAndButtons.appendChild(navigationDiv);
    // add to main DOM tree
    theText.parentNode.replaceChild(artAndButtons,theText);

    // for some reason, things don't work if the styling
    // for this div just gets moved out to articleTextDiv
    var columnStyleDiv = document.createElement("div");
    columnStyleDiv.setAttribute("id", "columnstyling");
    columnStyleDiv.setAttribute("style", "-moz-column-width: " + columnWidthEm + "em; -moz-column-gap: " + columnGapEm + "em; text-align:justify;" + extraStyle);
    var theFontSize = computeParaFontSize(theText);
    columnStyleDiv.style.fontSize = theFontSize + "px";
//	GM_log(theFontSize + " font size");
    columnHeightEm = parseInt((0.75*(window.innerHeight-getAbsolutePosition(artAndButtons).y)) / theFontSize) - 2;
//    GM_log("column height: " + columnHeightEm);
    columnStyleDiv.style.height = columnHeightEm + "em";

    articleTextDiv.appendChild(columnStyleDiv);
    columnStyleDiv.appendChild(theText);

	// create div for editing custom style, invisible
	// until the edit link is clicked
	var styleCustomizeId = "styleCustomize";
	var customCSSTextBoxId = "customCSS";
	function showStyleCustomizer() {
		document.getElementById(styleCustomizeId).style.display = "block";
		document.getElementById(customCSSTextBoxId).value = extraStyle;		
	}
	function hideStyleCustomizer() {
		document.getElementById(styleCustomizeId).style.display = "none";
	}	
	// make the style editing link work
    document.getElementById("openEditLink").addEventListener('click', showStyleCustomizer, true);    
	var customStyleCheckPos = getAbsolutePosition(customStyleCheckDiv);
//	GM_log("custom style pos: " + customStyleCheckPos.x + "," + customStyleCheckPos.y);
    var styleCustomizeDiv = document.createElement('div');
    styleCustomizeDiv.id = styleCustomizeId;
    styleCustomizeDiv.innerHTML = "<form name=\"customizeForm\"><textarea id=\"" + customCSSTextBoxId + "\" cols=60 rows=13>" + extraStyle + "</textarea></form><p style=\"text-align: center;\">The above is added to the global style for the page.  <br/>A refresh is required for the changes to take effect.</p>";
    // capture arrow keys so we don't switch pages when ppl are typing
    styleCustomizeDiv.addEventListener('keypress', function(e) { e.stopPropagation(); }, false);
    // submit changes button
	function updateCustomStyleAndClose() {
		extraStyle = document.getElementById(customCSSTextBoxId).value; 
		GM_setValue(extraStyleProp, extraStyle); 
		hideStyleCustomizer();	
	}
	var submitButton = makeButton(updateCustomStyleAndClose, "Save");
	// restore defaults button
	function restoreDefaultCustomStyle() {
		document.getElementById(customCSSTextBoxId).value = defaultExtraStyle;		
	}
	var restoreDefaultsButton = makeButton(restoreDefaultCustomStyle, "Restore Default");
	// cancel button
	var cancelButton = makeButton(hideStyleCustomizer, "Cancel");
	
    var styleButtonsDiv = document.createElement('div');
    styleButtonsDiv.setAttribute("style", "text-align: center; ");
    styleButtonsDiv.appendChild(restoreDefaultsButton);
    styleButtonsDiv.appendChild(submitButton);
    styleButtonsDiv.appendChild(cancelButton);
    styleCustomizeDiv.appendChild(styleButtonsDiv);
    
    
    styleCustomizeDiv.setAttribute("style", "width: auto; position: absolute; bottom: " + 
                                            (window.innerHeight - customStyleCheckPos.y) + "px; right: " + 
                                            (window.innerWidth - (customStyleCheckPos.x + customStyleCheckDiv.offsetWidth)) + 
                                            "px; opacity: 1; z-index: 2; border: 1px solid #990000; background-color: #ffdddd; text-align: left;");
    styleCustomizeDiv.style.display = "none";
	document.body.appendChild(styleCustomizeDiv);

	// set up increments for smooth scrolling
    var scrollMax = articleTextDiv.scrollWidth;
    var screenWidth = articleTextDiv.clientWidth;
    var columnGap = Math.round(theFontSize*columnGapEm);

    totalScroll = screenWidth + columnGap;
    //alert("total scroll: " + totalScroll);
    // TODO make a constant for number of scrolls
    scrollIncr = parseInt(totalScroll / 10);
    
    // pad out some columns so the last page is filled
	var columnsToPad = columnsInWidth(screenWidth, theFontSize);
    //alert("columns to pad: " + columnsToPad);
    // pad out the columns
    // TODO use a StringBuffer?
    var lineBreakString = "";
    for (var i = 0; i < columnsToPad; i++) {
        for (var j = 0; j < columnHeightEm; j++) {
            lineBreakString += "<br/>";
        }
    }
    var paddingDiv = document.createElement("div");
    paddingDiv.setAttribute('id', 'brpadding');
    paddingDiv.innerHTML = lineBreakString;
    theText.appendChild(paddingDiv);
    
    // compute page offsets 
    pageOffsets = calculateOffsetsNew(theText, screenWidth);
    numPages = pageOffsets.length;
    update_page_num();
    
    // add keyboard listener
    window.addEventListener('keypress', pressedKey, false);

    // just re-load the whole page on a resize for now
    window.addEventListener('resize', function(e) { window.location.href = window.location.href; }, true);
}

// main hyphenation code, from http://code.google.com/p/hyphenator/
var Hyphenator=(function(){
	//private properties
	/************ may be changed ************/
	var DEBUG=false; // turn DEBUG mode on:true/off:false
	//var BASEPATH='http://127.0.0.1/~mnater/mnn/hyph/%20working/trunk/';
	var BASEPATH='http://hyphenator.googlecode.com/svn/trunk/'; // change this if you copied the script to your webspace
	var SUPPORTEDLANG={'de':true,'en':true,'fr':true, 'nl':true}; //delete languages that you won't use (for better performance)
	var LANGUAGEHINT='Deutsch: de\tEnglish: en\tFran%E7ais: fr\tNederlands: nl';
	var PROMPTERSTRINGS={'de':'Die Sprache dieser Webseite konnte nicht automatisch bestimmt werden. Bitte Sprache angeben: \n\n'+LANGUAGEHINT,
						 'en':'The language of this website could not be determined automatically. Please indicate main language: \n\n'+LANGUAGEHINT,
						 'fr':'La langue de cette site ne pouvait pas %EAtre d%E9termin%E9e automatiquement. Veuillez indiquer une langue: \n\n'+LANGUAGEHINT,
						 'nl':'De taal van deze website kan niet automatisch worden bepaald. Geef de hoofdtaal op: \n\n'+LANGUAGEHINT};
	
	/************ don't change! ************/
	var DONTHYPHENATE={'script':true,'code':true,'pre':true,'img':true,'br':true,'samp':true,'kbd':true,'var':true,'abbr':true,'acronym':true,'sub':true,'sup':true,'button':true,'option':true,'label':true};
	var hyphenation={};
	var enableRemoteLoading=true;
	var hyphenateclass='hyphenate'; // the CSS-Classname of Elements that should be hyphenated eg. <p class="hyphenate">Text</p>
	var hyphen=String.fromCharCode(173); // the hyphen, defaults to &shy; Change by Hyphenator.setHyphenChar(c);
	var min=6; // only hyphanete words longer then or equal to 'min'. Change by Hyphenator.setMinWordLength(n);
	var bookmarklet=false;
	var patternsloaded={}; // this is set when the patterns are loaded
	var preparestate=0; //0: not initialized, 1: loading patterns, 2: ready
	var mainlanguage=null;
	var url='(\\w*:\/\/)((\\w*:)?(\\w*)@)?([\\w\.]*)?(:\\d*)?(\/[\\w#!:.?+=&%@!\-]*)*';
	var urlRE=new RegExp(url,'i');
	
	/************ UA related ************/
	var zerowidthspace='';
	// The zerowidthspace is inserted after a '-' in compound words
	// like this, Firefox and IE will break after '-' if necessary
	function _createZeroWidthSpace() {
		var ua=navigator.userAgent.toLowerCase();
		if(ua.indexOf('firefox')!=-1 || ua.indexOf('msie 7')!=-1) {
			zerowidthspace=String.fromCharCode(8203); //Unicode zero width space
		} else if(ua.indexOf('msie 6')!=-1) {
			zerowidthspace='';
		}
	}
	
	// checks if the script runs as a Bookmarklet
	function _checkIfBookmarklet() {
		var loc=null;
		var jsArray = document.getElementsByTagName('script');
		for(var i=0, l=jsArray.length; i<l; i++) {
			if(!!jsArray[i].getAttribute('src')) {
				loc=jsArray[i].getAttribute('src');
			}
			if(!loc) {
				continue;
			} else if(loc.indexOf('Hyphenator.js?bm=true')!=-1) {
				bookmarklet=true;
			}
		}
	};
    
	function _log(msg) {
	   if(window.console) {
	       window.console.log(msg); //Safari
	   } else if(window.opera) { 
	       window.opera.postError(msg);
	   }  else {
	       //alert(msg);
	   }
	}
		
	//private methods	
	/************ Language related methods ************/
	// looks for a language for the site. If there is no
	// hint in the html, ask the user!
	function _autoSetMainLanguage() {
		var el=document.getElementsByTagName('html')[0];
		mainlanguage=_getLang(el);
		if(!mainlanguage) {
			var m=document.getElementsByTagName('meta');
			for(var i=0; i<m.length; i++) {
				//<meta http-equiv="content-language" content="xy">	
				if(!!m[i].getAttribute('http-equiv') && (m[i].getAttribute('http-equiv')=='content-language')) {
					mainlanguage = m[i].getAttribute('content').substring(0,2);
				}
				//<meta name="DC.Language" content="xy">
				if(!!m[i].getAttribute('name') && (m[i].getAttribute('name')=='DC.Language')) {
					mainlanguage = m[i].getAttribute('content').substring(0,2);
				}			
				//<meta name="language" content="xy">
				if(!!m[i].getAttribute('name') && (m[i].getAttribute('name')=='language')) {
					mainlanguage = m[i].getAttribute('content').substring(0,2);
				}
			}
		}
		if(!mainlanguage) {
			var text='';
			var ul=(navigator.language)?navigator.language:navigator.userLanguage;
			ul=ul.substring(0,2);
			if(SUPPORTEDLANG[ul]) {
				text=PROMPTERSTRINGS[ul];
			} else {
				text=PROMPTERSTRINGS.en;
			}
			var lang=window.prompt(unescape(text), ul);
			if(SUPPORTEDLANG[lang]) {
				mainlanguage = lang;
			}
		}
	};

    // gets the lang for the given Element
    // if not set, use the mainlanguage of the hole site
	function _getLang(el) {
		if(!!el.getAttribute('lang')) {
			return el.getAttribute('lang').substring(0,2);
		}
		// The following doesn't work in IE due to a bug when getAttribute('xml:lang') in a table
		/*if(!!el.getAttribute('xml:lang')) {
			return el.getAttribute('xml:lang').substring(0,2);
		}*/
		if(mainlanguage) {
			return mainlanguage;
		}
		return null;
	};

	/************ pattern (loading) related methods ************/
	// Loads the hyphenation-patterns for specific languages
	// by adding a new <script>-Element
	// Why not using AJAX? Because it is restricted to load data
	// only from the same site - so the Bookmarklet won't work...
	function _loadPatterns(lang) {
		if(DEBUG)
			_log("load patterns "+lang);
		if(SUPPORTEDLANG[lang] && !patternsloaded[lang]) {
	        var url=BASEPATH+'patterns/'+lang+'.js';
	        if(lang=="de") {
	        	url=BASEPATH+'patterns/newpatterns/de.js';
	        }
		} else {
			return;
		}
		if(document.createElement) {
			var head=document.getElementsByTagName('head').item(0);
			var script=document.createElement('script');
			script.src=url;
			script.type='text/javascript';
			head.appendChild(script);
		}
		if(DEBUG)
			_log('Loading '+url);
	};

	/************ hyphenate helper methods ************/
	// walk throug the document and do the job
	function _runHyphenation() {
		var body=document.getElementsByTagName('body')[0];
		if(Hyphenator.isBookmarklet()) {
			Hyphenator.hyphenateElement(body);
		} else {
			if(document.getElementsByClassName) {
				var elements=document.getElementsByClassName(hyphenateclass);
				for(var i=0, l=elements.length; i<l; i++)
				{
					Hyphenator.hyphenateElement(elements[i]);
				}
			} else {
				var elements=body.getElementsByTagName('*');
				for(var i=0, l=elements.length; i<l; i++)
				{
					if(elements[i].className.indexOf(hyphenateclass)!=-1) {
						Hyphenator.hyphenateElement(elements[i]);
					}
				}
			}
		}
	};
	
	//Run automatically when the DOM is loaded
	/*  
	 *  Code by Stuart Langridge
	 *  http://www.kryogenix.org/days/2007/09/26/shortloaded
	 *  based on code by Dean Edwards and John Resig
	 *  http://dean.edwards.name/weblog/2006/06/again/
	 *	http://javascript.nwbox.com/ContentLoaded/
	 *
	 */
	function _runOnContentLoaded() {
		(function(i) {
			var u =navigator.userAgent;
			var e=/*@cc_on!@*/false;
			var st =setTimeout;
			if(/webkit/i.test(u)) {
				st(function(){
						var dr=document.readyState;
						if(dr=="loaded"||dr=="complete") {
							i()
						} else {
							st(arguments.callee,10);
						}
					},
				10);
			}
			else if((/mozilla/i.test(u)&&!/(compati)/.test(u)) || (/opera/i.test(u))) {
				document.addEventListener("DOMContentLoaded",i,false);
			} else if(e) {
				(function(){
					var t=document.createElement('doc:rdy');
					try{
						t.doScroll('left');
						i();
						t=null;
					} catch(e) {
						st(arguments.callee,0);
					}
				})();
			} else {
				window.onload=i;
			}
		})(Hyphenator.hyphenateDocument);
	};


	/************ init methods ************/
	function _autoinit() {
		for(var lang in SUPPORTEDLANG) {
			patternsloaded[lang]=false;
		}
		_autoSetMainLanguage();
		_createZeroWidthSpace();
		_checkIfBookmarklet();
	};
	_autoinit();
	return {
		//public properties
	    leftmin:{},  // How many chars can be on the old line at minimum. This is set by the patternfile
        rightmin:{}, // How many chars can be on the new line at minimum. This is set by the patternfile
        shortestPattern:{}, // this is set by the patternfile
        longestPattern:{}, // this is set by the patternfile
        specialChars:{}, // Language specific chars such as Ã©Ã Ã¢Ã§ etc. This is set by the patternfile
		patterns:{}, // patterns are stored in here, when they have finished loading
		
		//public methods
		run: function() {
			_runOnContentLoaded();
		},
		addExceptions: function(words) { //words is a comma separated string of words
		 	var w=words.split(',');
		 	for(var i=0, l=w.length; i<l; i++) {
		 		var key=w[i].replace(/-/g,'');
				if(!hyphenation[key]) {
					hyphenation[key]=w[i];
				}
			}
		},	
		setClassName: function(str) {
            hyphenateclass=str || 'hyphenate';
		},
		setMinWordLength: function(mymin) {
            min=mymin || 6;
		},
		setHyphenChar: function(str) {
            hyphen=str || String.fromCharCode(173);
		},
		setRemoteLoading: function(bool) {
			enableRemoteLoading=bool;
		},
		isPatternLoaded: function(lang) {
			return patternsloaded[lang];
		},
		updatePatternsLoadState:function(lang,bool) {
			patternsloaded[lang]=bool;
		},
		isBookmarklet: function() {
			return bookmarklet;
		},
		prepare: function() {
        // get all languages that are used and preload the patterns
			if(DEBUG)
				_log("preparing-state: 1 (loading)");
			preparestate=1;
			var doclanguages={};
			doclanguages[mainlanguage]=true;
			var elements=document.getElementsByTagName('body')[0].getElementsByTagName('*');
			var lang=null;
			for(var i=0, l=elements.length; i<l; i++) {
				if(lang=_getLang(elements[i])) {
					if(SUPPORTEDLANG[lang]) {
						doclanguages[lang]=true;
					} else {
						//alert('Language '+lang+' is not yet supported.');
					}
				}
			}
			if(DEBUG) {
				for(var l in doclanguages) {
					_log("language found: "+l);
				}
			}
			for(lang in doclanguages) {
				_loadPatterns(lang);
			}
			// wait until they are loaded
			interval=window.setInterval(function(){
				finishedLoading=false;
				for(lang in doclanguages) {
					if(!patternsloaded[lang]) {
						finishedLoading=false;
						break;
					} else {
						finishedLoading=true;
					}
				}
				if(finishedLoading) {
					window.clearInterval(interval);
					preparestate=2;
					if(DEBUG)
						_log("preparing-state: 2 (loaded)");
				}
			},100);

		},
		hyphenateDocument: function() {
			if(DEBUG)
				_log("hyphenateDocument");
			if(preparestate!=2 && enableRemoteLoading) {
				if(preparestate==0) {
					Hyphenator.prepare();               // load all language patterns that are used
				}
				var interval=window.setInterval(function(){
					if(preparestate==2) {
						window.clearInterval(interval);
						_runHyphenation();
					}
				},10);
			} else {
				_runHyphenation();
			}
		},
		hyphenateElement : function(el,lang) {
        // if there is text hyphenate each word
        // if there are other elements, go deeper!
		// maybe this could be faster, somehow!
			if(DEBUG)
				_log("hyphenateElement: "+el.tagName+" id: "+el.id);
			if(!lang) {
				if(DEBUG)
					_log("lang not set");
				var lang=_getLang(el);
				if(DEBUG)
					_log("set lang to "+lang);
			} else {
				if(DEBUG)
					_log("got lang from parent ("+lang+")");
				var newlang=_getLang(el);
				if(newlang!=lang) {
					var lang=newlang;
					if(DEBUG)
						_log("but element has own lang ("+lang+")");
				}
			}
			if(DEBUG)
				_log("language: "+lang);
			var wrd='[\\w'+Hyphenator.specialChars[lang]+'Â­-]{'+min+',}';
			var wrdRE=new RegExp(wrd,'i');
			function __hyphenate(word) {
				if(urlRE.test(word)) {
					return Hyphenator.hyphenateURL(word);
				} else {
					return Hyphenator.hyphenateWord(lang,word);
				}
			}
			var genRegExp=new RegExp('('+url+')|('+wrd+')','gi');
            for(var i=0; (n=el.childNodes[i]); i++) {
				if(n.nodeType==3 && n.data.length>=min) { //type 3=#text -> hyphenate!
                    n.data=n.data.replace(genRegExp,__hyphenate);
                    if(DEBUG)
						_log("hyphenation done for: "+el.tagName+" id: "+el.id);
                } else if(n.nodeType==1 && !DONTHYPHENATE[n.nodeName.toLowerCase()]) {			//typ 1=element node -> recursion
                    if(DEBUG)
						_log("traversing: "+n.nodeName.toLowerCase());
                    Hyphenator.hyphenateElement(n,lang);
                }
            }
            el.style.visibility='visible';
        },
		hyphenateWord    : function(lang,word) {
			if(word=='') {
				return '';
			}
			if(word.indexOf('Â­')!=-1) { //this String only contains the unicode char 'Soft Hyphen' wich may not be visible in some editors!
				//word already contains shy; -> leave at it is!
				return word;
			}
			if(hyphen=='&shy;') {
				hyphen=String.fromCharCode(173);
			}
			if(hyphenation[word]) {
				return hyphenation[word].replace(/-/g,hyphen);
			}
			if(word.indexOf('-')!=-1) {
				//word contains '-' -> put a zerowidthspace after it and hyphenate the parts separated with '-'
				var parts=word.split('-');
				for(var i=0, l=parts.length; i<l; i++) {
					parts[i]=Hyphenator.hyphenateWord(lang,parts[i]);
				}
				return parts.join('-'+zerowidthspace);
			}
			//finally the core hyphenation algorithm
			var positions = []; 		//hyphenating points
			var result = [];			//syllabs
			var w='_'+word.toLowerCase()+'_';	//mark beginning an end
			var wl=w.length;
			var i=wl-2;
			do {
				positions[i]=0;
			} while(i--);
			var s=wl-1;

			do {
				var maxl=wl-s;
				var window=w.substring(s);
				for(var l=Hyphenator.shortestPattern[lang]; l<=maxl && l<=Hyphenator.longestPattern[lang]; l++) {
					var part=window.substring(0,l);	//window from position s with length l
					var values=null;
					if(Hyphenator.patterns[lang][part]!==undefined) {
						values=Hyphenator.patterns[lang][part];
						var i=s-1;
						var v;
						for(var p=0, l=values.length; p<l; p++, i++) {
							v=parseInt(values.charAt(p));
							if(v>positions[i]) {
								positions[i]=v; //set the values, overwriting lower values
							}
						}
					}
				}
			} while(s--)
			wl=word.length;
			for(i=1; i<wl; i++) {
				if(!!(positions[i]&1) && i>=Hyphenator.leftmin[lang] && i<=word.length-Hyphenator.rightmin[lang]) {
					result.push(word.substring(result.join('').length,i)); //Silben eintragen
				}
			}
			result.push(word.substring(result.join('').length,i)); //Letzte Silbe eintragen
			return result.join(hyphen);
		},
		hyphenateURL: function(url){
			var res='';
			res=url.replace(/\//gi,zerowidthspace+'/');
			res=res.replace(/\./gi,zerowidthspace+'.');
			return res;
		}

	};
})();

// disable remote loading
Hyphenator.setRemoteLoading(false);

// load english patterns, copied from hyphenator en.js file
﻿Hyphenator.leftmin['en']=2;
Hyphenator.rightmin['en']=2;
Hyphenator.shortestPattern['en']=2;
Hyphenator.longestPattern['en']=8;
Hyphenator.specialChars['en']='';
Hyphenator.patterns['en']={"_ach":"00004","_adder":"0004000","_aft":"00010","_alt":"00030","_amat":"000500","_anc":"00050","_ang":"00004","_anim":"000050","_ant":"00004","_ante":"000300","_antis":"0000050","_ars":"00050","_artie":"0004000","_arty":"000400","_asc":"00030","_asp":"00010","_ass":"00010","_aster":"0000005","_atom":"000005","_aud":"00010","_avi":"00040","_awn":"00004","_bag":"00040","_bana":"000500","_base":"000040","_ber":"00004","_bera":"000500","_besm":"000300","_besto":"0005000","_bri":"00002","_butti":"0000400","_campe":"0000400","_canc":"000050","_capab":"0000050","_carol":"0000500","_cat":"00040","_cela":"000400","_ch":"0004","_chilli":"00000050","_ci":"0002","_citr":"000050","_coe":"00030","_cor":"00040","_corner":"00005000","_demoi":"0004000","_deo":"00030","_dera":"000300","_deri":"000300","_desc":"000040","_dictio":"00000005","_dot":"00040","_duc":"00040","_dumb":"000005","_earth":"0000005","_easi":"000030","_eb":"0004","_eer":"00004","_eg":"0002","_eld":"00050","_elem":"000300","_enam":"000003","_eng":"00030","_ens":"00030","_equit":"0005050","_erri":"000400","_es":"0003","_eu":"0003","_eye":"00005","_fes":"00003","_former":"00005000","_ga":"0002","_ge":"0002","_gent":"000034","_geog":"000500","_gia":"00050","_gib":"00040","_gor":"00040","_handi":"0000050","_hank":"000050","_he":"0002","_heroi":"0000050","_hes":"00003","_het":"00003","_hib":"00030","_hier":"000300","_honey":"0000500","_hono":"000030","_hov":"00005","_idl":"00040","_idol":"000003","_imm":"00030","_impin":"0005000","_in":"0001","_inci":"000300","_ine":"00002","_ink":"00020","_ins":"00030","_irr":"00050","_isi":"00040","_jur":"00030","_lacy":"000400","_lam":"00040","_later":"0000500","_lath":"000005","_le":"0002","_lege":"000050","_len":"00004","_lep":"00005","_lev":"00001","_lig":"00040","_liga":"000050","_lin":"00020","_lio":"00030","_lit":"00040","_maga":"000055","_malo":"000050","_mana":"000050","_marti":"0000500","_me":"0002","_merc":"000030","_meter":"0005000","_mis":"00001","_misti":"0000050","_mone":"000030","_moro":"000300","_muta":"000500","_mutab":"0000050","_nic":"00040","_od":"0002","_odd":"00005","_ofte":"000500","_orato":"0005000","_orc":"00030","_ord":"00010","_ort":"00030","_os":"0003","_ostl":"000400","_oth":"00003","_out":"00003","_pedal":"0000500","_pete":"000500","_petit":"0005000","_pie":"00040","_pion":"000050","_pit":"00020","_prem":"000030","_rac":"00040","_rant":"000040","_rationa":"000000500","_ree":"00002","_remit":"0005000","_res":"00002","_restat":"00050000","_rig":"00040","_ritu":"000050","_roq":"00040","_rost":"000050","_rowd":"000050","_rud":"00040","_scie":"000030","_self":"000005","_sell":"000005","_sen":"00020","_serie":"0005000","_sh":"0002","_si":"0002","_sing":"000004","_st":"0004","_stabl":"0000500","_sy":"0002","_ta":"0004","_te":"0004","_tenan":"0000500","_th":"0002","_ti":"0002","_til":"00004","_timo":"000055","_ting":"000004","_tink":"000050","_tona":"000040","_top":"00040","_topi":"000050","_tous":"000050","_tribut":"00000500","_una":"00010","_unce":"000300","_under":"0000005","_une":"00010","_unk":"00050","_uno":"00050","_unu":"00030","_up":"0003","_ure":"00003","_usa":"00050","_vende":"0000400","_vera":"000500","_wili":"000050","_ye":"0004","ab_":"4000","abal":"05000","aban":"05000","abe":"0002","aberd":"005000","abia":"00050","abitab":"0050500","ablat":"005000","aboliz":"0055000","abr":"4000","abrog":"005000","abul":"00300","acar":"04000","acard":"005000","acaro":"005000","aceou":"050000","acer":"00100","achet":"050000","aci":"4200","acie":"03000","acin":"00100","acio":"03000","acrob":"005000","actif":"000500","acul":"00300","acum":"00400","ad":"020","addin":"004000","ader_":"005000","adi":"2000","adia":"03000","adica":"003000","adier":"000400","adio":"03000","adit":"03000","adiu":"05000","adle":"00400","adow":"00300","adran":"005000","adsu":"00400","adu":"4000","aduc":"03000","adum":"00500","aer":"0040","aerie":"000040","af":"020","aff":"0004","agab":"04000","agan":"00040","agell":"005000","ageo":"00040","ageu":"40000","agi":"0010","agl":"4040","agn":"0010","ago":"0200","agog":"30000","agoni":"003000","aguer":"050000","agul":"00500","agy":"0400","aha":"0300","ahe":"0300","ahl":"0040","aho":"0300","ai":"002","aia":"0500","aic_":"03000","aily":"00500","ain":"0440","ainin":"000500","aino":"00050","aiten":"000500","aj":"010","aken":"00100","alab":"00500","alad":"00300","alar":"04000","aldi":"40000","ale":"2000","alend":"003000","alenti":"0400000","aleo":"05050","ali":"0010","alia_":"004000","alie":"00040","allev":"005000","allic":"400000","alm":"4000","alog_":"050000","aly_":"04000","alys":"40000","alyst":"550000","alyt":"50000","alyz":"30000","ama":"4000","amab":"00500","amag":"00300","amara":"000500","amasc":"005000","amatis":"0400000","amato":"045000","amera":"005000","amic":"00300","amif":"00500","amily":"005000","amin":"00100","amino":"000400","amo":"0200","amon":"05000","amori":"000050","ampen":"000500","an":"020","anage":"003000","analy":"300000","anar":"03000","anarc":"003000","anari":"000040","anati":"030000","and":"4000","andes":"000040","andis":"003000","andl":"00100","andow":"004000","anee":"05000","anen":"03000","anest_":"0050000","aneu":"03000","ang":"2000","angie":"000500","angl":"00100","anic":"04100","anies":"030000","anif":"00330","anime":"004000","animi":"050000","anine":"050000","anio":"00300","anip":"03000","anish":"003000","anit":"00300","aniu":"03000","ankli":"004000","anniz":"500000","ano":"0004","anot":"00500","anoth":"000005","ansa":"00200","ansco":"004000","ansn":"00400","ansp":"00200","anspo":"000300","anst":"00400","ansur":"004000","antal":"000004","antie":"004000","anto":"40000","antr":"00200","antw":"00400","anua":"00300","anul":"00300","anur":"05000","ao":"400","apar":"00004","apat":"00500","apero":"005000","apher":"030000","aphi":"40000","apilla":"0400000","apillar":"00500000","apin":"00300","apita":"003000","apitu":"030000","apl":"0200","apoc":"00005","apola":"005000","apori":"000050","apost":"000030","apses":"000500","apu":"0300","aque":"00005","ar":"220","aract":"003000","arade":"050000","aradis":"0050000","aral":"00300","aramete":"05000000","arang":"000040","arap":"00030","arat":"00400","aratio":"0500000","arativ":"0050000","arau":"05000","arav":"00504","araw":"00004","arbal":"000004","archan":"0040000","ardine":"0050000","ardr":"00400","areas":"005000","aree":"03000","arent":"003000","aress":"050000","arfi":"00400","arfl":"00400","ari":"0010","arial":"005000","arian":"003000","ariet":"030000","arim":"00400","arinat":"0050000","ario":"00300","ariz":"00200","armi":"00200","arod":"00550","aroni":"050000","aroo":"03000","arp":"0020","arq":"0030","arre":"00004","arsa":"00400","arsh":"00200","as_":"4000","asab":"00400","asant":"003000","ashi":"00004","asia_":"050000","asib":"03000","asic":"03000","asit":"55040","aski":"00030","asl":"0040","asoc":"04000","asph":"00500","assh":"00400","asten":"003000","astr":"00100","asura":"000050","ata":"0200","atabl":"003000","atac":"00500","atalo":"003000","atap":"00500","atec":"00050","atech":"005000","atego":"003000","aten_":"003000","atera":"003000","atern":"000050","aterna":"0500000","atest":"003000","atev":"00500","ath":"4000","athem":"000500","athen":"050000","atho":"00400","athom":"000500","ati_":"40000","atia":"05000","atib":"00550","atic":"00100","atif":"00300","ationar":"00000500","atitu":"003000","atog":"04000","atom":"02000","atomiz":"0050000","atop":"04000","atos":"04000","atr":"0100","atrop":"005000","atsk":"00400","attag":"004000","atte":"00500","atth":"00400","atu":"0200","atua":"00500","atue":"00500","atul":"00300","atura":"003000","aty":"0200","aub":"0040","augh":"00003","augu":"00300","aul":"0042","aund":"00050","aur":"0030","ausib":"005000","auten":"000500","auth":"00100","ava":"0200","avag":"00300","avan":"05000","aveno":"000400","avera":"003000","avern":"005000","avery":"005000","avi":"0010","avier":"000400","avig":"00300","avoc":"00500","avor":"01000","away":"30000","awi":"0030","awly":"00400","aws":"0004","axic":"00400","axid":"00400","ayal":"00500","aye":"0004","ays":"0004","azier":"000400","azzi":"00050","ba_":"5000","badger":"0005000","bage":"00400","bala":"00010","bandag":"0005000","bane":"00040","bani":"00030","barbi":"000005","baria":"000040","bassi":"000400","bat":"1000","baz":"0040","bb":"210","bbe":"0200","bber":"03000","bbina":"000400","bd":"410","be_":"4000","beak":"00004","beat":"00003","bed":"4020","beda":"00300","bede":"00300","bedi":"00300","begi":"00300","begu":"00500","bel":"1000","beli":"00100","belo":"00300","bem":"4050","benig":"005000","benu":"00500","bes":"4004","besp":"00300","bestr":"005000","bet":"3000","betiz":"000500","betr":"00500","betw":"00300","bew":"0030","beyo":"00500","bf":"200","bh":"430","bib":"0020","bid":"0040","bie":"3000","bien":"00500","bier":"00400","bif":"2300","bil":"1000","biliz":"003000","binar":"000054","bind":"00040","binet":"005000","biogr":"003000","biou":"00500","bit":"0020","bitio":"303000","bitr":"00300","bitua":"300500","bitz":"05000","bj":"010","bk":"004","bl":"022","blath":"000005","ble_":"04000","blen":"00004","blesp":"500000","blis":"03000","blo":"0400","blunt":"000040","bm":"410","bn":"430","bneg":"00050","bod":"3000","bodi":"00030","boe":"0040","bolic":"000300","bombi":"000400","bona":"00040","bonat":"000500","boo":"3000","bor_":"50000","bora":"41000","bord":"00050","bore":"50000","bori":"50000","bos":"5004","bota":"05000","both":"00005","boto":"00400","bound":"000003","bp":"400","brit":"40000","broth":"000003","bs":"252","bsor":"00004","bt":"200","btl":"0040","bto":"0400","btr":"0300","buffer":"0004000","buga":"00400","buli":"00300","bumi":"00004","bun":"0040","bunti":"000040","bure":"00300","busie":"000500","busse":"000040","bust":"50000","buta":"40000","butio":"300000","buto":"05000","bv":"010","bw":"450","by_":"5000","bys":"0004","ca":"100","cabin":"000300","cabl":"00100","cach":"00004","caden":"005000","cag":"4004","cah":"2500","calat":"003000","calla":"000400","callin":"0000500","calo":"40000","cand":"00050","cane":"00040","canic":"000400","canis":"000500","caniz":"000300","canty":"000400","cany":"00004","caper":"005000","carom":"000500","caster":"0000500","castig":"0005000","casy":"40000","cath":"00400","cativ":"400000","caval":"000500","cc":"030","ccha":"00005","ccia":"00040","ccompa":"0000005","ccon":"00004","ccout":"000030","ce_":"2000","ced_":"40000","ceden":"400000","cei":"3000","cel_":"50000","cell":"30000","cen":"1000","cenc":"30000","cene":"20040","ceni":"40000","cent":"30000","cep":"3000","ceram":"005000","cesa":"40000","cessi":"300000","cessib":"0005050","cest":"00050","cet":"0004","ceta":"05400","cew":"0004","ch":"200","ch_":"4000","chab":"40300","chanic":"5000000","chanis":"0055000","che":"0002","cheap":"000003","ched":"40000","chelo":"000500","chemi":"300000","chene":"005000","cher_":"003000","chers":"003000","chin":"40100","chine_":"5000000","chiness":"00500000","chini":"500000","chio":"50000","chit":"30000","chiz":"00020","cho":"3002","chti":"00400","ci":"100","cia":"3000","ciab":"00250","ciar":"00050","cic":"0050","cier":"40000","cific_":"5000000","cii":"4000","cila":"00400","cili":"30000","cim":"2000","cin":"2000","cina":"04000","cinat":"300000","cinem":"000300","cing":"01000","cing_":"050000","cino":"50000","cion":"00004","cipe":"40000","ciph":"00300","cipic":"400000","cista":"400000","cisti":"400000","cit":"2100","citiz":"000300","ciz":"5000","ck":"001","cki":"0030","cl":"144","clar":"40000","claratio":"050000000","clare":"500000","clem":"00040","clic":"40000","clim":"00004","cly":"0004","cn":"050","co":"100","coag":"00500","coe":"0002","cog":"2000","cogr":"00400","coi":"0004","coinc":"003000","coli":"00050","colo":"50000","color":"000300","comer":"000500","cona":"00040","cone":"04000","cong":"00030","cont":"00050","copa":"00300","copic":"000300","copl":"00400","corb":"40000","coron":"000030","cose":"00040","cov":"0001","cove":"00004","cowa":"00050","coze":"00050","cozi":"00500","cq":"010","crast":"000050","crat_":"500000","cratic":"5000000","creat":"000300","cred":"50000","creta":"430000","crev":"00040","cri":"0002","crif":"00050","crin":"04000","cris":"00004","criti":"500000","cropl":"000400","cropo":"000050","crose":"000040","crud":"00040","cs":"432","ct":"210","ctab":"00040","ctang":"005000","ctant":"050000","cte":"0200","cter":"03000","cticu":"040000","ctimi":"000030","ctur":"00040","ctw":"0400","cud":"0005","cuf":"0400","cui":"0400","cuity":"005000","culi":"50000","cultis":"0004000","cultu":"300000","cuma":"00200","cume":"03000","cumi":"00400","cun":"3000","cupi":"00300","cupy":"00500","curab":"000540","curia":"005000","cus":"1000","cussi":"000040","cut":"3400","cutie":"004000","cutiv":"450000","cutr":"40000","cy":"100","cze":"0004","da":"120","da_":"5000","dab":"2340","dach":"00004","daf":"4000","dag":"2000","dam":"0022","dang":"00030","dard":"00005","dark":"00005","dary":"40000","dat":"3000","dativ":"400000","dato":"40000","dav":"5004","dave":"00050","day":"5000","db":"010","dc":"050","dd":"014","de_":"2000","deaf":"00005","debit":"000500","debon":"004000","decan":"000004","decil":"004000","decom":"005000","ded":"2100","dee_":"40000","deif":"00500","delie":"000040","deliq":"000550","delo":"00500","dem":"0400","dem_":"50000","demic":"300000","demic_":"0005000","demil":"005000","demons":"0040000","demor":"000005","den":"1000","denar":"004000","deno":"00300","dentif":"0000050","denu":"00300","dep":"0010","depa":"00300","depi":"00004","depu":"00200","deq":"0300","derh":"04000","derm":"50000","derniz":"0000500","ders":"00050","des":"0002","des_":"02000","desc":"00100","deso":"00250","desti":"000300","destr":"003000","desu":"00400","det":"0010","deto":"00200","dev":"0010","devil":"000300","dey":"4000","df":"410","dga":"0400","dget":"03040","dgi":"0010","dgy":"0200","dh":"012","di_":"5000","dia":"1430","diab":"00050","dicam":"004000","dice":"04000","dict":"30000","did":"3000","dien":"50300","dif":"0100","dige":"00300","dilato":"0040000","din":"0100","dina":"10000","dine_":"300000","dini":"50000","diniz":"005000","dio":"1000","diog":"00050","dipl":"00400","dir":"0002","dire":"00100","dirti":"000050","dis":"0001","disi":"50000","dist":"04030","diti":"02000","div":"1010","dj":"010","dk":"052","dla":"4500","dle_":"30000","dled":"30000","dles_":"300000","dless":"400000","dlo":"2300","dlu":"4500","dly":"2000","dm":"010","dn":"414","do":"100","do_":"3000","dode":"00500","doe":"5000","dof":"2500","dog":"0400","dola":"00400","doli":"00004","dolor":"005000","domiz":"000500","donat":"003000","doni":"00004","dood":"00030","dopp":"00040","dor":"0400","dos":"3000","dout":"45000","dov":"0040","dox":"3000","dp":"010","dr":"100","dragon":"0000500","drai":"40000","dre":"0004","drear":"000050","dren":"50000","drib":"00040","dril":"00004","drop":"00040","drow":"40000","drupli":"5000000","dry":"4000","ds":"212","dsp":"0040","dsw":"0400","dsy":"0400","dth":"0200","du":"100","dua":"0110","duc":"0020","duca":"01000","ducer":"000500","duct_":"400000","ducts":"400000","duel":"00500","dug":"0040","dule":"03000","dumbe":"000400","dun":"0040","dup":"4000","dupe":"00400","dv":"010","dw":"010","dy":"020","dyn":"5000","dyse":"00400","dysp":"00050","eab":"0140","eact":"03000","ead":"0001","eadie":"000500","eage":"00400","eager":"005000","eal":"0040","ealer":"000500","ealou":"000300","eamer":"000300","eand":"05000","eara":"00030","earc":"00040","eares":"000500","earic":"000400","earil":"000400","eark":"00050","eart":"00020","earte":"000030","easp":"00500","eass":"03000","east":"00003","eat":"0020","eaten":"000500","eathi":"000030","eatif":"050000","eatu":"04300","eav":"0020","eaven":"000300","eavi":"00050","eavo":"00050","eb":"210","ebel_":"040000","ebels":"040000","eben":"04000","ebit":"04000","ebr":"0300","ecad":"04000","ecanc":"000050","ecca":"00005","ece":"0100","ecessa":"0050000","eci":"0020","ecib":"04000","ecificat":"005000000","ecifie":"0050000","ecify":"005000","ecim":"00300","ecit":"00040","ecite":"050000","eclam":"040000","eclus":"040000","ecol":"02000","ecomm":"040000","ecompe":"0400000","econc":"040000","ecor":"02000","ecora":"003000","ecoro":"000500","ecr":"0100","ecrem":"040000","ectan":"004000","ecte":"00400","ecu":"0100","ecul":"04000","ecula":"003000","eda":"2200","edd":"4030","eder":"04100","edes":"00040","edi":"4000","edia":"03000","edib":"00300","edica":"003000","edim":"00300","edit":"00100","ediz":"00050","edo":"4000","edol":"04000","edon":"00002","edri":"04000","edul":"04000","edulo":"005000","eec":"0020","eedi":"00030","eef":"0020","eeli":"00030","eely":"00400","eem":"0020","eena":"00400","eep":"0041","ees":"0024","eest":"00004","eety":"00400","eex":"0500","ef":"010","efere":"043000","eff":"1000","efic":"04000","efici":"500000","efil":"00004","efine":"030000","efinite":"00550000","efit":"30000","efores":"0000500","efuse_":"0400000","egal":"40000","eger":"00004","egib":"00500","egic":"00400","eging":"005000","egit":"05005","egn":"0050","ego_":"04000","egos":"04000","egul":"00100","egur":"05000","egy":"5000","eh":"014","eher":"00004","ei":"002","eic":"0500","eid":"0050","eig":"0002","eigl":"00500","eimb":"03000","einf":"03000","eing":"01000","einst":"050000","eird":"00040","eite":"00030","eith":"00300","eity":"05000","ej":"010","ejud":"04000","ejudi":"005000","ekin":"00040","ekla":"00400","ela":"0100","ela_":"04000","elac":"04000","eland":"000040","elativ":"0050000","elaw":"04000","elaxa":"000004","elea":"03000","elebra":"0050000","elec":"50000","eled":"04000","elega":"003000","elen":"05000","eler":"04100","eles":"01000","elf":"0020","eli":"0020","elibe":"030000","elic_":"045000","elica":"003000","elier":"030000","eligib":"0050000","elim":"05000","eling":"043000","elio":"03000","elis":"02000","elish":"005000","eliv":"03003","ella":"40000","ellab":"004000","ello":"00004","eloc":"05000","elog":"00500","elop_":"003000","elsh":"00200","elta":"00400","elud":"05000","elug":"00500","emac":"04000","emag":"04000","eman":"05000","emana":"005000","emb":"0050","eme":"0100","emel":"02000","emet":"04000","emica":"003000","emie":"00040","emigra":"0050000","emin":"00102","emine":"005000","emini":"003300","emis":"04000","emish":"005000","emiss":"050000","emiz":"00300","emniz":"500000","emog":"00040","emonio":"0000050","empi":"00300","emul":"04000","emula":"005000","emun":"00030","emy":"0300","enamo":"005000","enant":"040000","encher":"0000400","endic":"003000","enea":"05000","enee":"05000","enem":"00300","enero":"005000","enesi":"005000","enest":"005000","enetr":"003000","enew":"03000","enics":"005000","enie":"05000","enil":"05000","enio":"03000","enish":"003000","enit":"00300","eniu":"05000","eniz":"50000","enn":"4000","eno":"4000","enog":"00040","enos":"04000","enov":"00300","ensw":"00400","entage":"0005000","enthes":"4000000","enua":"00300","enuf":"00500","eny_":"03000","enz":"4030","eof":"0500","eog":"0020","eoi":"0404","eol":"0300","eopar":"000300","eor":"0100","eore":"00300","eorol":"005000","eos":"0004","eot":"0400","eoto":"00400","eout":"05000","eow":"0500","epa":"0200","epai":"03000","epanc":"005000","epel":"05000","epent":"030000","epetitio":"005000000","ephe":"00004","epli":"04000","epo":"0100","eprec":"040000","epreca":"0050000","epred":"040000","epreh":"003000","epro":"03000","eprob":"040000","epsh":"00400","eptib":"005050","eput":"04000","eputa":"005000","eq":"010","equil":"000030","equis":"043030","era":"0010","erab":"00040","erand":"400000","erar":"00300","erati_":"4000000","erb":"2000","erbl":"00400","erch":"00300","erche":"004000","ere_":"20000","ereal":"030000","ereco":"000500","erein":"000300","erel_":"005000","eremo":"003000","erena":"005000","erence":"0050000","erene":"400000","erent":"003000","ereq":"00040","eress":"005000","erest":"003000","eret":"00004","erh":"0010","eri":"0010","eria":"01004","erick":"500000","erien":"030000","erier":"000400","erine":"003000","erio":"01000","erit":"40000","eriu":"00400","eriv":"00040","eriva":"040000","erm":"0034","ernis":"004000","ernit":"400000","erniz":"500000","erno":"00300","ero":"2000","erob":"00500","eroc":"05000","eror":"00040","erou":"00100","ers":"0010","erset":"003000","erter":"000300","ertl":"40000","ertw":"00300","eru":"4000","erut":"00040","erwau":"500000","esa":"0140","esage_":"0400000","esages":"0400000","esc":"0020","esca":"02000","escan":"005000","escr":"03000","escu":"00500","ese":"0120","esec":"02000","esecr":"005000","esenc":"005000","esert_":"0400000","eserts":"0400000","eserva":"0400000","esh":"4000","esha":"03000","eshen":"000500","esi":"0100","esic":"02000","esid":"02000","esiden":"0050000","esigna":"0050000","esim":"02500","esin":"00440","esiste":"0000400","esiu":"00040","eskin":"050000","esmi":"00400","esol":"02000","esolu":"003000","eson":"02000","esona":"005000","esp":"0100","esper":"003000","espira":"0050000","espre":"004000","ess":"2000","essib":"004040","estan":"000004","estig":"003000","estim":"005000","esto":"40200","eston":"030000","estr":"20000","estro":"050000","estruc":"0000005","esur":"02000","esurr":"005000","esw":"0040","etab":"00040","etend":"000040","eteo":"03000","ethod":"000003","etic":"00100","etide":"050000","etin":"00004","etino":"000400","etir":"05000","etitio":"0500000","etitiv":"0050000","etn":"4000","etona":"005000","etra":"03000","etre":"03000","etric":"003000","etrif":"005000","etrog":"003000","etros":"005000","etua":"00300","etym":"00500","etz":"0050","eu":"400","eun":"0500","eup":"0300","euro":"00300","eus":"0004","eute":"00004","eutil":"000050","eutr":"00500","evap":"00025","evas":"02000","evast":"005000","evea":"05000","evell":"003000","evelo":"000030","eveng":"050000","eveni":"000040","ever":"00100","everb":"050000","evi":"0100","evid":"00300","evil":"00040","evin":"04000","eviv":"00040","evoc":"05000","evu":"0500","ewa":"0100","ewag":"04000","ewee":"05000","ewh":"0300","ewil":"00005","ewing":"003000","ewit":"03000","exp":"1000","eyc":"5000","eye_":"50000","eys":"0004","fa":"100","fabl":"00300","fabr":"00030","face":"00400","fag":"4000","fain":"00004","falle":"000050","fama":"40400","famis":"000500","far":"5000","farth":"000500","fata":"00300","fathe":"003000","fato":"40000","fault":"000005","fb":"450","fd":"400","fe_":"4000","feas":"00004","feath":"000003","feb":"0040","feca":"40000","fect":"50000","fed":"2000","feli":"00300","femo":"00400","fend":"00020","fende":"000050","fer":"0001","ferr":"50000","fev":"0004","ff":"410","ffes":"04000","ffie":"04000","ffin_":"050000","ffis":"02500","ffly":"04000","ffy":"0200","fh":"400","fi":"100","fia":"0030","fic_":"23000","fical":"430000","fican":"030000","ficate":"4000000","ficen":"030000","ficer":"003000","fici":"00040","ficia":"500000","ficie":"500000","fics":"40000","ficu":"00300","fidel":"005000","fight":"000005","fili":"00050","fillin":"0000500","fily":"40000","fin":"2000","fina":"50000","find":"00025","fine":"00200","fing":"01030","finn":"00040","fisti":"000400","fl":"042","fless":"050000","flin":"00004","flore":"000300","fly":"0205","fm":"400","fn":"400","fo":"100","fon":"5000","fonde":"000400","font":"00040","for":"0020","forat":"005000","foray":"000500","foret":"000050","fori":"00040","forta":"000050","fos":"0005","fp":"450","frat":"00040","frea":"05000","fresc":"000050","fri":"0002","fril":"00004","frol":"00005","fs":"230","ft":"200","fto":"0400","fty":"0200","fu":"300","fuel":"00500","fug":"4000","fumin":"004000","fune":"00500","furi":"00300","fusi":"00004","fuss":"00040","futa":"40000","fy":"100","ga":"100","gaf":"0004","gal_":"50000","gali":"30000","galo":"00300","gam":"2000","gamet":"005000","gamo":"05000","ganis":"000500","ganiz":"003000","ganiza":"0000500","gano":"40000","garn":"00054","gass":"00004","gath":"00003","gativ":"400000","gaz":"4000","gb":"030","gd":"004","ge_":"2000","ged":"2000","geez":"00004","gelin":"000400","gelis":"005000","geliz":"005000","gely":"40000","gen":"1000","genat":"004000","geniz":"005000","geno":"40000","geny":"40000","geo":"1000","geom":"00300","gery":"04000","gesi":"50000","geth":"00005","geto":"40000","gety":"00400","gev":"0040","gg":"412","gge":"0200","gger":"03000","gglu":"00005","ggo":"0004","ghin":"00300","ghout":"005000","ghto":"00400","gi_":"5000","gia":"1040","giar":"00050","gic":"0100","gicia":"500000","gico":"04000","gien":"00005","gies_":"500000","gil":"0004","gimen":"030000","gin_":"34000","ginge":"000500","gins":"54000","gio":"5000","gir":"3000","girl":"00040","gisl":"03000","giu":"0040","giv":"5000","giz":"3000","gl":"002","gla":"0004","gladi":"000050","glas":"50000","gle":"1000","glib":"00040","glig":"03000","glo":"3000","glor":"00030","gm":"010","gmy":"0400","gna":"0040","gna_":"04000","gnett":"000040","gni":"0100","gnin":"02000","gnio":"04000","gno":"0100","gnon":"04000","go":"100","go_":"3000","gob":"0005","goe":"5000","gog":"3440","gois":"00300","gon":"0002","gona":"43300","gondo":"000005","goni":"00300","goo":"5000","goriz":"005000","gorou":"000500","gos_":"50000","gov":"0001","gp":"030","gr":"100","grada":"400000","grai":"04000","gran":"00002","graph_":"5000000","grapher":"05000000","graphic":"50000000","graphy":"4000000","gray":"40000","gren":"00040","gress_":"4000000","grit":"40000","gro":"0400","gruf":"00004","gs":"002","gste":"05000","gth":"0003","gua":"0040","guard":"300000","gue":"2000","guit":"50050","gun":"3000","gus":"3000","gut":"4040","gw":"030","gy":"100","gyn":"2530","gyra":"00500","habl":"03040","hach":"00004","haem":"00040","haet":"00040","hagu":"05000","hala":"00300","halam":"000030","ham":"0040","hanci":"000400","hancy":"000400","hand_":"500000","hang":"00040","hanger":"0000500","hango":"000050","haniz":"055000","hank":"00040","hante":"000400","hapl":"00030","hapt":"00050","haran":"003000","haras":"005000","hard":"00020","harde":"000030","harle":"000400","harpen":"0000500","harter":"0005000","hass":"00050","haun":"00004","haz":"5000","haza":"00030","hb":"010","head":"10000","hear":"30000","hecan":"004000","hecat":"050000","hed":"0400","hedo":"00505","heli":"00340","hellis":"0004000","helly":"000400","helo":"05000","hemp":"00040","hen":"0020","hena":"00004","henat":"000500","heor":"00050","hep":"0005","hera":"04000","herap":"000030","herba":"000400","herea":"000050","hern":"03000","herou":"050000","hery":"03000","hes":"0100","hesp":"00250","het":"0040","heted":"000400","heu":"0004","hf":"010","hh":"010","hian":"00500","hico":"00400","high":"00005","hil":"0402","himer":"000004","hina":"04000","hione":"000040","hip":"0040","hirl":"00040","hiro":"00300","hirp":"00040","hirr":"00040","hisel":"000300","hiss":"00040","hither":"0000500","hiv":"0020","hk":"400","hl":"414","hlan":"00004","hlo":"0200","hlori":"000300","hm":"410","hmet":"00004","hn":"210","hodiz":"050000","hods":"05000","hog":"0040","hoge":"00004","holar":"000500","hole":"30040","homa":"00400","home":"00003","hona":"00040","hony":"00500","hood":"30000","hoon":"00004","horat":"000500","horis":"005000","horte":"000030","horu":"00500","hose":"00040","hosen":"005000","hosp":"00010","hous":"10000","house":"000003","hovel":"000500","hp":"450","hr":"404","hree":"00005","hroniz":"0005000","hropo":"000300","hs":"412","hsh":"0400","htar":"04000","hten":"00100","htes":"00500","hty":"0400","hug":"0040","humin":"004000","hunke":"000500","hunt":"00040","hust":"00034","hut":"0040","hw":"010","hwart":"040000","hype":"00300","hyph":"00300","hys":"0020","ia":"210","ial":"0200","iam":"0004","iamete":"0005000","ian":"0200","ianc":"40000","iani":"00030","iant":"40040","iape":"00500","iass":"00004","iativ":"040000","iatric":"0040000","iatu":"04000","ibe":"0004","ibera":"003000","ibert":"005000","ibia":"00500","ibin":"00300","ibit_":"005000","ibite":"005000","ibl":"0100","ibli":"00300","ibo":"0500","ibr":"0100","ibri":"02500","ibun":"05000","icam":"40000","icap":"50000","icar":"40000","icar_":"040000","icara":"040000","icas":"00005","icay":"04000","iccu":"00004","iceo":"40000","ich":"4000","ici":"2000","icid":"05000","icina":"005000","icip":"02000","icipa":"003000","icly":"04000","icoc":"02500","icr":"4100","icra":"50000","icry":"04000","icte":"00400","ictu":"00002","ictua":"004300","icula":"003000","icum":"00400","icuo":"00500","icur":"03000","id":"200","idai":"04000","idanc":"005000","idd":"0050","ideal":"000300","ides":"00040","idi":"0200","idian":"005000","idiar":"000400","idie":"05000","idio":"00300","idiou":"000500","idit":"00100","idiu":"00500","idle":"03000","idom":"04000","idow":"00300","idr":"0400","idu":"0200","iduo":"00500","ie":"204","iede":"00040","iega":"50500","ield":"00003","iena":"00054","iene":"00040","ienn":"05000","ienti":"030000","ier_":"01000","iesc":"03000","iest":"01000","iet":"0300","if_":"4000","ifero":"005000","iffen":"000500","iffr":"00400","ific_":"400000","ifie":"03000","ifl":"0300","ift":"4000","ig":"200","igab":"00050","igera":"003000","ighti":"000030","igi":"4000","igib":"03000","igil":"00300","igin":"00300","igit":"00300","igl":"0440","igo":"0200","igor":"00300","igot":"00500","igre":"05000","igui":"00050","igur":"00100","ih":"030","ii":"454","ij":"030","ik":"400","ila":"0100","ilab":"00340","ilade":"040000","ilam":"02500","ilara":"000500","ileg":"03000","iler":"00100","ilev":"00004","ilf":"0050","ili":"0010","ilia":"00300","ilib":"00200","ilio":"00300","ilist":"004000","ilit":"20000","iliz":"00200","illab":"000500","iln":"4000","iloq":"00300","ilty":"00400","ilur":"00500","ilv":"0030","imag":"04000","image":"003000","imary":"000500","imentar":"00000050","imet":"40000","imi":"0010","imida":"005000","imile":"000500","imini":"050000","imit":"40000","imni":"00400","imon":"03000","imu":"0200","imula":"003000","in_":"2000","inau":"04300","inav":"40000","incel":"000004","incer":"003000","ind":"4000","indling":"00500000","ine":"2000","inee":"03000","inerar":"0000400","iness":"050000","inga":"40000","inge":"40000","ingen":"005000","ingi":"40000","ingling":"00500000","ingo":"40000","ingu":"40000","ini":"2000","ini_":"05000","inia":"04000","inio":"00300","inis":"00100","inite_":"0500000","initio":"5000000","inity":"003000","ink":"4000","inl":"4000","inn":"2000","ino":"2100","inoc":"04040","inos":"00040","inot":"04000","ins":"2000","inse":"00300","insura":"0000050","int_":"20000","inth":"20400","inu":"0010","inus":"05000","iny":"4000","io":"200","io_":"4000","ioge":"00004","iogr":"00200","iol":"0100","iom":"0040","ionat":"000300","ionery":"0004000","ioni":"00030","ioph":"00500","iori":"00030","ios":"0400","ioth":"00500","ioti":"05000","ioto":"00400","iour":"04000","ip":"200","ipe":"0004","iphras":"0000004","ipi":"0030","ipic":"00400","ipre":"00404","ipul":"00300","iqua":"03000","iquef":"005000","iquid":"003000","iquit":"003030","ir":"400","ira":"0100","irab":"00040","irac":"04000","irde":"00050","irede":"000400","iref":"04000","irel":"04004","ires":"04000","irgi":"00500","iri":"0010","iride":"000500","iris":"00400","iritu":"000300","iriz":"55200","irmin":"004000","irog":"00040","iron_":"500000","irul":"00500","is_":"2000","isag":"00500","isar":"00300","isas":"00005","isc":"2010","isch":"00300","ise":"4000","iser":"00300","isf":"3000","ishan":"005000","ishon":"003000","ishop":"000500","isib":"00300","isid":"00040","isis":"05000","isitiv":"0050000","isk":"4040","islan":"000004","isms":"40000","iso":"0200","isomer":"0005000","isp":"0010","ispi":"00200","ispy":"00400","iss":"4010","issal":"004000","issen":"000004","isses":"004000","ista_":"004000","iste":"00100","isti":"00100","istly":"000400","istral":"4000000","isu":"0200","isus":"00500","ita_":"40000","itabi":"000400","itag":"04000","itam":"40050","itan":"03000","itat":"03000","ite":"2000","itera":"003000","iteri":"050000","ites":"00400","ith":"2000","iti":"0100","itia":"40000","itic":"42000","itica":"003000","itick":"550000","itig":"00300","itill":"005000","itim":"02000","itio":"20000","itis":"40000","itism":"040000","itom":"02550","iton":"40000","itram":"040000","itry":"00500","itt":"4000","ituat":"003000","itud":"05000","itul":"00300","itz_":"40000","iu":"010","iv":"200","ivell":"003000","iven_":"003000","iver_":"043000","ivers_":"0400000","ivil_":"005000","ivio":"00500","ivit":"00100","ivore":"050000","ivoro":"003300","ivot":"04300","iw":"450","ixo":"0040","iy":"400","izar":"40000","izi":"0004","izont":"500000","ja":"500","jacq":"00040","jap":"0040","je":"100","jers":"00050","jestie":"4000000","jesty":"400000","jew":"0003","jop":"0040","judg":"50000","ka_":"3000","kab":"0300","kag":"0500","kais":"00004","kal":"0004","kb":"010","ked":"0200","kee":"1000","keg":"0040","keli":"00500","kend":"03040","ker":"0100","kes":"0004","kest_":"030000","kety":"00400","kf":"030","kh":"004","ki":"010","ki_":"5000","kic":"5200","kill":"04000","kilo":"00005","kim":"0400","kin_":"04000","kinde":"000400","kiness":"0500000","king":"00040","kip":"0040","kis":"0004","kish":"05000","kk":"004","kl":"010","kley":"40000","kly":"4000","km":"010","knes":"05000","kno":"1200","kor":"0050","kosh":"00004","kou":"0300","kron":"00050","ks":"412","ksc":"0400","ksl":"0040","ksy":"0400","kt":"050","kw":"010","labic":"000300","labo":"04000","laci":"00004","lade":"04000","lady":"00300","lagn":"00040","lamo":"00030","land":"30000","landl":"000400","lanet":"000500","lante":"000400","larg":"00040","lari":"00030","lase":"00040","latan":"005000","lateli":"4000000","lativ":"400000","lav":"4000","lava":"00440","lb":"210","lbin":"00004","lc":"412","lce":"0004","lci":"0300","ld":"200","lde":"0200","ldere":"004000","lderi":"004000","ldi":"0004","ldis":"00500","ldr":"0300","ldri":"04000","lea":"0020","lebi":"00400","left":"00005","leg_":"50000","legg":"50000","lemat":"004000","lematic":"00050000","len_":"40000","lenc":"30000","lene_":"500000","lent":"10000","leph":"00300","lepr":"00400","lerab":"000050","lere":"00040","lerg":"30000","leri":"34000","lero":"04000","les":"0002","lesco":"005000","lesq":"50000","less":"30000","less_":"500000","leva":"03000","lever_":"0004000","levera":"0004000","levers":"0004000","ley":"3000","leye":"40000","lf":"200","lfr":"0500","lg":"414","lga":"0500","lgar":"00003","lges":"04000","lgo":"0003","lh":"230","liag":"00400","liam":"00200","liariz":"0000500","lias":"00400","liato":"004000","libi":"00500","licio":"500000","licor":"004000","lics":"40000","lict_":"400000","licu":"04000","licy":"03000","lida":"03000","lider":"000500","lidi":"30000","lifer":"000300","liff":"04000","lifl":"00400","ligate":"5000000","ligh":"30000","ligra":"004000","lik":"3000","lil":"4440","limbl":"000400","limi":"00030","limo":"00400","limp":"04040","lina":"04000","line":"14000","linea":"000300","lini":"00030","linker":"0000500","liog":"00500","liq":"4400","lisp":"00040","lit":"0100","lit_":"02000","litica":"5000000","litics":"0550000","liver":"000300","liz":"0100","lj":"400","lka":"0003","lkal":"03000","lkat":"00040","ll":"010","llaw":"04000","lle":"0200","llea":"05000","llec":"03000","lleg":"03000","llel":"03000","llen":"03040","llet":"03040","lli":"0020","llin":"02004","llina":"050000","llo":"0040","lloqui":"0000005","llout":"005000","llow":"05000","lm":"200","lmet":"05000","lming":"003000","lmod":"04000","lmon":"00004","ln":"212","lo_":"3000","lobal":"000500","loci":"00400","lof":"4000","logic":"300000","logo":"05000","logu":"30000","lomer":"000300","long":"50000","loni":"00040","loniz":"033000","lood":"00005","lope_":"500000","lopi":"00030","lopm":"03000","lora":"00004","lorato":"0040000","lorie":"005000","lorou":"000500","los_":"50000","loset":"000500","losophiz":"500000000","losophy":"50000000","lost":"00040","lota":"00400","lound":"000050","lout":"20000","lov":"4000","lp":"200","lpab":"00050","lpha":"03000","lphi":"05000","lping":"005000","lpit":"03000","lpl":"0400","lpr":"0500","lr":"410","ls":"212","lsc":"0400","lse":"0200","lsie":"04000","lt":"400","ltag":"00500","ltane":"000005","lte":"0100","lten":"00004","ltera":"000004","lthi":"00030","lties_":"0500000","ltis":"00004","ltr":"0100","ltu":"0002","ltura":"000030","lua":"0050","lubr":"00300","luch":"00004","luci":"00300","luen":"00300","luf":"0004","luid":"00500","luma":"00400","lumi":"50000","lumn_":"050000","lumnia":"5000000","luo":"0030","luor":"00030","lup":"4000","luss":"00004","luste":"000300","lut":"1000","lven":"05000","lvet":"05004","lw":"210","ly":"100","lya":"4000","lyb":"4000","lyme":"00500","lyno":"00300","lys":"2004","lyse":"05000","ma":"100","mab":"2000","maca":"00200","machine":"00500000","macl":"00400","magin":"000500","magn":"50000","mah":"2000","maid":"00005","mald":"40000","malig":"003000","malin":"005000","malli":"000400","malty":"000400","mania":"500000","manis":"000500","maniz":"000300","map":"4000","marine_":"00500000","mariz":"005000","marly":"000400","marv":"00030","masce":"005000","mase":"00040","mast":"00010","mate":"50000","math":"00003","matis":"003000","matiza":"4000000","mb":"410","mbat":"00045","mbil":"05000","mbing":"043000","mbiv":"00040","mc":"450","me_":"4000","med":"2000","med_":"40000","media":"500000","medie":"003000","medy":"05500","meg":"0020","melon":"000500","melt":"00040","mem":"0020","memo":"00013","men":"1000","mena":"00040","menac":"000500","mende":"000400","mene":"40000","meni":"00040","mens":"00004","mensu":"000005","ment":"30000","mente":"000400","meon":"00500","mersa":"050000","mes":"2000","mesti":"300000","meta":"00400","metal":"000300","mete":"00100","methi":"005000","metr":"04000","metric":"5000000","metrie":"0050000","metry":"003000","mev":"0040","mf":"410","mh":"200","mi_":"5000","mia":"0030","mida":"00040","midg":"00040","mig":"0004","milia":"300000","milie":"055000","mill":"04000","mina":"00040","mind":"30000","minee":"050000","mingl":"040000","mingli":"0005000","mingly":"0500000","mint":"00040","minu":"04000","miot":"00004","mis":"0200","miser_":"0004000","misl":"00050","misti":"000400","mistry":"0500000","mith":"40000","miz":"0200","mk":"400","ml":"410","mm":"010","mmary":"000500","mn":"410","mna":"0040","mnin":"04000","mno":"0040","mo":"100","mocr":"40000","mocratiz":"500000000","mod":"0021","mogo":"00400","mois":"00002","moise":"000500","mok":"4000","molest":"0050000","mome":"00300","monet":"000500","monge":"000500","monia":"000030","monism":"0004000","monist":"0004000","moniz":"003000","monol":"000004","mony_":"003000","mor":"0020","mora_":"400000","mos":"0002","mosey":"005000","mosp":"00300","moth":"00003","mouf":"05000","mous":"30000","mov":"0020","mp":"410","mpara":"000005","mparab":"0005000","mpari":"000050","mpet":"03000","mphas":"000004","mpi":"0200","mpia":"00040","mpies":"005000","mpin":"04100","mpir":"05000","mpis":"00500","mpori":"000300","mposite":"00005000","mpous":"040000","mpov":"00005","mptr":"00400","mpy":"0200","mr":"430","ms":"412","msh":"0400","msi":"0500","mt":"400","mu":"100","mular":"000054","mult":"50000","multi":"000003","mum":"3000","mun":"0002","mup":"4000","muu":"0040","mw":"400","na":"100","nab":"2120","nabu":"04000","nac_":"40000","naca":"00400","nact":"05000","nager_":"0005000","nak":"0004","nali":"00400","nalia":"005000","nalt":"40000","namit":"005000","nan":"0200","nanci":"000004","nanit":"000400","nank":"00004","narc":"00030","nare":"40000","nari":"00030","narl":"00040","narm":"05000","nas":"0400","nasc":"00040","nasti":"000500","nat":"0200","natal":"003000","natomiz":"00005000","nau":"0200","nause":"000300","naut":"30000","nave":"00040","nb":"414","ncar":"00005","nces_":"040000","ncha":"03000","ncheo":"050000","nchil":"050000","nchis":"030000","ncin":"00100","ncit":"00400","ncoura":"0000050","ncr":"0100","ncu":"0100","ndai":"04000","ndan":"05000","nde":"0100","ndest_":"0050000","ndib":"00040","ndif":"05200","ndit":"01000","ndiz":"03000","nduc":"05000","ndur":"00040","ndwe":"00200","ne_":"2000","near":"03000","neb":"0020","nebu":"00030","nec":"0020","neck":"50000","ned":"2000","negat":"004000","negativ":"00050000","nege":"50000","nela":"00400","neliz":"000500","nemi":"00500","nemo":"00400","nen":"1000","nene":"40000","neo":"3000","nepo":"00400","neq":"0020","ner":"0100","nerab":"000050","nerar":"040000","nere":"02000","neri":"04050","nerr":"00040","nes":"1000","nes_":"20000","nesp":"40000","nest":"20000","nesw":"40000","netic":"300000","nev":"0040","neve":"05000","new":"0040","nf":"030","ngab":"04000","ngel":"03000","ngene":"000440","ngere":"050000","ngeri":"030000","ngha":"00500","ngib":"03000","ngin":"00100","ngit":"05000","ngla":"04000","ngov":"00004","ngsh":"00500","ngu":"0100","ngum":"04000","ngy":"0200","nh":"414","nha":"0004","nhab":"00003","nhe":"0004","nia":"3400","nian":"00300","niap":"00400","niba":"00300","nibl":"00400","nid":"0040","nidi":"00500","nier":"00400","nifi":"00200","nificat":"00500000","nigr":"05000","nik":"0004","nim":"0100","nimiz":"003000","nin":"0100","nine_":"500000","ning":"00040","nio":"0040","nis_":"50000","nista":"000400","nit":"0200","nith":"04000","nitio":"300000","nitor":"030000","nitr":"00300","nj":"010","nk":"402","nkero":"050000","nket":"03000","nkin":"00300","nkl":"0100","nl":"410","nm":"050","nme":"0004","nmet":"00004","nn":"412","nne":"0004","nnial":"000300","nniv":"00040","nobl":"00040","noble":"003000","nocl":"05000","nod":"4320","noe":"3000","nog":"4000","noge":"00004","noisi":"000050","noli":"00540","nologis":"50000000","nomic":"300000","nomiz":"055000","nomo":"00400","nomy":"00300","non":"0040","nonag":"000400","noni":"00050","noniz":"050000","nop":"4000","nopoli":"5005500","norab":"000500","norary":"0040000","nosc":"40000","nose":"00040","nost":"00050","nota":"00500","nou":"1000","noun":"30000","novel":"000303","nowl":"00003","np":"014","npi":"0004","nprec":"000040","nq":"010","nr":"010","nru":"0004","ns":"212","nsab":"00500","nsati":"000004","nsc":"0040","nse":"0200","nses":"04300","nsid":"00001","nsig":"00004","nsl":"0200","nsm":"0030","nsoc":"04000","nspe":"00400","nspi":"05000","nstabl":"0000500","nt":"010","ntab":"00040","nters":"000030","nti":"0020","ntib":"05000","ntier":"000400","ntif":"00020","ntine":"030000","nting":"043000","ntip":"00040","ntrolli":"00000500","nts":"0040","ntume":"000300","nua":"0010","nud":"0040","nuen":"00500","nuffe":"000400","nuin":"03000","nuit":"30300","num":"0400","nume":"00100","numi":"05000","nun":"3040","nuo":"0300","nutr":"00300","nv":"012","nw":"014","nym":"0004","nyp":"0004","nz":"400","nza":"0300","oa":"400","oad":"0003","oales":"055000","oard":"00003","oase":"00040","oaste":"000050","oati":"00050","obab":"00330","obar":"05000","obel":"00040","obi":"0100","obin":"02000","obing":"005000","obr":"0300","obul":"00300","oce":"0100","och":"0004","ochet":"030000","ocif":"00003","ocil":"04000","oclam":"040000","ocod":"04000","ocrac":"003000","ocratiz":"00500000","ocre":"00003","ocrit":"500000","octora":"0000050","ocula":"003000","ocure":"050000","odded":"005000","odic":"00300","odio":"00030","odo":"0204","odor":"00003","oduct_":"0050000","oducts":"0050000","oel":"0400","oeng":"05000","oer":"0300","oeta":"00400","oev":"0300","ofi":"0200","ofite":"005000","ofitt":"000040","ogar":"02550","ogativ":"0050000","ogato":"040000","oge":"0100","ogene":"050000","ogeo":"05000","oger":"04000","ogie":"03000","ogis":"11000","ogit":"00300","ogl":"0400","ogly":"05200","ogniz":"300000","ogro":"04000","ogui":"00050","ogy":"1000","ogyn":"20000","oh":"012","ohab":"00005","oi":"002","oices":"000300","oider":"003000","oiff":"00004","oig":"0004","oilet":"005000","oing":"03000","ointer":"0000500","oism":"05000","oison":"005000","oisten":"0000500","oiter":"003000","oj":"050","ok":"200","oken":"03000","okie":"00500","ola":"0100","olan":"04000","olass":"000004","old":"0020","olde":"00010","oler":"00300","olesc":"030000","olet":"03000","olfi":"00400","oli":"0020","olia":"03000","olice":"030000","olid_":"005000","olif":"03040","olil":"05000","oling":"003000","olio":"05000","olis_":"050000","olish":"003000","olite":"050000","olitio":"0500000","oliv":"05000","ollie":"000040","ologiz":"0050000","olor":"00040","olpl":"00500","olt":"0020","olub":"00300","olume":"003000","olun":"00300","olus":"05000","olv":"0020","oly":"0200","omah":"00500","omal":"00050","omatiz":"0050000","ombe":"00200","ombl":"00400","ome":"0200","omena":"003000","omerse":"0050000","omet":"04000","ometry":"0050000","omia":"03000","omic_":"003000","omica":"003000","omid":"05000","omin":"00100","omini":"050000","ommend":"5000000","omoge":"000400","omon":"04000","ompi":"00300","ompro":"000005","on":"020","ona":"0010","onac":"00400","onan":"03000","onc":"0010","oncil":"300000","ond":"2000","ondo":"00500","onen":"03000","onest":"005000","ongu":"00400","onic":"00100","onio":"03000","onis":"00100","oniu":"05000","onkey":"003000","onodi":"004000","onomy":"003000","ons":"0030","onspi":"000004","onspira":"00000050","onsu":"00004","onten":"000004","onti":"00340","ontif":"000005","onum":"00500","onva":"00005","oo":"002","oode":"00050","oodi":"00050","ook":"0040","oopi":"00030","oord":"03000","oost":"00005","opa":"0200","oped":"00050","oper":"00100","opera":"300000","operag":"4000000","oph":"2000","ophan":"050000","opher":"050000","oping":"003000","opit":"03000","opon":"05000","oposi":"040000","opr":"0100","opu":"0010","opy":"0005","oq":"010","ora":"0100","ora_":"05000","orag":"04300","oraliz":"0050000","orange":"0050000","orea":"00050","oreal":"050000","orei":"00300","oresh":"000500","orest_":"0050000","orew":"00004","orgu":"00400","oria":"45000","orica":"003000","oril":"05000","orin":"00100","orio":"01000","ority":"003000","oriu":"03000","ormi":"00200","orne":"00020","orof":"05000","oroug":"003000","orpe":"00500","orrh":"30000","orse":"00400","orsen":"000500","orst":"00004","orthi":"003000","orthy":"003000","orty":"00400","orum":"05000","ory":"0100","osal":"00300","osc":"0020","osce":"00400","oscop":"030000","oscopi":"4000000","oscr":"05000","osie":"00440","ositiv":"0050000","osito":"003000","osity":"003000","osiu":"00040","osl":"0040","oso":"0200","ospa":"00400","ospo":"00400","osta":"00200","ostati":"0500000","ostil":"005000","ostit":"005000","otan":"04000","oteleg":"0000040","oter_":"003000","oters":"005000","otes":"04000","oth":"4000","othesi":"0005000","othi":"00034","otic_":"003000","otica":"005000","otice":"030000","otif":"03000","otis":"03000","otos":"00050","ou":"002","oubl":"00300","ouchi":"000050","ouet":"00500","oul":"0040","ouncer":"0000500","ound":"00020","ouv":"0050","oven":"00400","overne":"0000400","overs":"000030","overt":"004000","ovis":"03000","oviti":"000004","ovol":"05400","owder":"003000","owel":"00300","owest":"005000","owi":"0010","owni":"00050","owo":"0400","oya":"0010","pa":"100","paca":"00400","pace":"00400","pact":"00040","pad":"0400","pagan":"500000","pagat":"030000","pai":"0400","pain":"00004","pal":"0400","pana":"00040","panel":"000300","panty":"000400","pany":"00300","pap":"0010","papu":"00400","parabl":"0000500","parage":"0005000","pardi":"000500","pare":"30000","parel":"000500","pari":"04400","paris":"000400","pate":"00200","pater":"005000","pathic":"5000000","pathy":"005000","patric":"0040000","pav":"0004","pay":"3000","pb":"410","pd":"004","pe_":"4000","pea":"3040","pearl":"000040","pec":"0020","ped":"2200","pede":"30000","pedi":"30000","pedia":"000004","pedic":"000400","pee":"0400","peed":"00040","pek":"0004","pela":"00400","pelie":"000040","penan":"004000","penc":"04000","penth":"000400","peon":"00500","pera_":"040000","perabl":"0000500","perag":"040000","peri":"04000","perist":"0000500","permal":"0004000","perme":"000005","pern":"04000","pero":"00030","perti":"000300","peru":"00500","perv":"00010","pet":"0020","peten":"005000","petiz":"005000","pf":"400","pg":"400","ph_":"4000","phari":"000050","pheno":"000300","pher":"00400","phes_":"004000","phic":"00100","phie":"50000","phing":"005000","phisti":"5000000","phiz":"30000","phl":"0020","phob":"30000","phone":"300000","phoni":"500000","phor":"00040","phs":"4000","pht":"0030","phu":"5000","phy":"1000","pia":"0030","pian":"00004","picie":"004000","picy":"00400","pid":"0400","pida":"05000","pide":"00300","pidi":"50000","piec":"30000","pien":"00300","pigrap":"0040000","pilo":"00300","pin":"0020","pin_":"04000","pind":"00004","pino":"04000","pio":"3010","pion":"00004","pith":"03000","pitha":"005000","pitu":"00200","pk":"232","pl":"122","plan":"30000","plast":"000050","plia":"00030","plier":"000500","plig":"40000","plin":"00040","ploi":"00004","plum":"00040","plumb":"000040","pm":"410","pn":"230","poc":"0040","pod_":"50000","poem":"00500","poet":"00305","pog":"5040","poin":"00002","point":"500000","polyt":"000050","poni":"00400","pop":"0040","por":"1400","pory":"00400","pos":"1000","poss":"00010","pot":"0400","pota":"00400","poun":"50000","pp":"410","ppara":"000500","ppe":"0200","pped":"04000","ppel":"05000","ppen":"03000","pper":"03000","ppet":"03000","pposite":"00050000","pr":"002","praye":"000040","preci":"500000","preco":"000500","preem":"000300","prefac":"0000500","prela":"000400","prer":"00030","prese":"030000","press":"300000","preten":"0005000","prev":"00030","prie":"50040","print":"000043","pris":"00040","priso":"000030","proca":"030000","profit":"0000500","prol":"00030","prose":"000030","prot":"00010","ps":"212","pse":"0200","psh":"0040","psib":"04000","pt":"210","ptab":"00540","pte":"0200","pth":"0200","ptim":"00030","ptur":"00040","ptw":"0400","pub":"0003","pue":"0004","puf":"0004","pulc":"00030","pum":"0040","pun":"0020","purr":"00040","pus":"5000","put":"0020","pute":"50000","puter":"000300","putr":"00300","putted":"0004000","puttin":"0004000","pw":"030","qu":"002","quav":"00050","que_":"20000","quer":"30000","quet":"30000","rab":"2000","rabi":"00300","rache":"000040","racl":"05000","raffi":"000500","raft":"00040","rai":"0200","ralo":"00400","ramet":"000300","rami":"02000","raneo":"000050","range":"000400","rani":"04000","rano":"00500","raper":"000300","raphy":"300000","rarc":"00050","rare":"00004","raref":"000500","raril":"400000","ras":"0200","ration":"0000004","raut":"00040","ravai":"005000","ravel":"000300","razie":"005000","rb":"010","rbab":"04000","rbag":"04000","rbi":"0002","rbif":"00040","rbin":"02000","rbine":"050000","rbing_":"0050000","rbo":"0040","rc":"010","rce":"0200","rcen":"00004","rcha":"03000","rcher":"000400","rcib":"04040","rcit":"00400","rcum":"00003","rdal":"04000","rdi":"0020","rdia":"00040","rdier":"000400","rdin":"00004","rding":"003000","re_":"2000","real":"00100","rean":"00300","rearr":"005000","reav":"50000","reaw":"00400","rebrat":"0500000","recoll":"0005000","recompe":"00050000","recre":"004000","red":"2200","rede":"00100","redis":"003000","redit":"000500","refac":"004000","refe":"00200","refer_":"0050000","refi":"00300","refy":"00400","regis":"000300","reit":"00500","reli":"00100","relu":"00500","renta":"040400","rente":"000400","reo":"0010","repin":"005000","reposi":"0040000","repu":"00100","rer":"0104","reri":"04000","rero":"00004","reru":"00500","res_":"04000","respi":"004000","ressib":"0000500","rest":"00020","restal":"0050000","restr":"003000","reter":"004000","retiz":"004040","retri":"003000","reu":"0002","reuti":"005000","rev":"0002","reval":"004000","revel":"000300","rever_":"0505000","revers":"0050000","revert":"0050000","revil":"005000","revolu":"0005000","rewh":"00400","rf":"010","rfu":"0004","rfy":"0400","rg":"002","rger":"00300","rget":"03000","rgic":"03000","rgin":"00040","rging":"003000","rgis":"05000","rgit":"05000","rgl":"0100","rgon":"00040","rgu":"0300","rh":"004","rh_":"4000","rhal":"40000","ria":"0030","riab":"00040","riag":"00400","rib":"0400","riba":"00030","ricas":"000500","rice":"04000","rici":"40000","ricid":"500000","ricie":"004000","rico":"04000","rider":"000500","rienc":"003000","rient":"003000","rier":"00100","riet":"00500","rigan":"000500","rigi":"50000","riliz":"000300","riman":"500000","rimi":"00050","rimo":"30000","rimpe":"000400","rina":"02000","rina_":"500000","rind":"00040","rine":"00040","ring":"00040","rio":"0010","riph":"50000","riphe":"000050","ripl":"00200","riplic":"0005000","riq":"0400","ris":"0200","ris_":"04000","risc":"00040","rish":"03000","risp":"00040","ritab":"003030","rited_":"0500000","riter_":"0005000","riters":"0005000","ritic":"000300","ritu":"00200","ritur":"000500","rivel":"000500","rivet":"000300","rivi":"00030","rj":"030","rket":"03000","rkle":"00400","rklin":"004000","rl":"010","rle":"0004","rled":"02000","rlig":"04000","rlis":"04000","rlish":"005000","rlo":"0304","rm":"010","rmac":"00050","rme":"0200","rmen":"03000","rmers":"005000","rming":"003000","rming_":"0400000","rmio":"04000","rmit":"03000","rmy":"0400","rnar":"04000","rnel":"03000","rner":"04000","rnet":"05000","rney":"03000","rnic":"05000","rnis":"01004","rnit":"03000","rniv":"03000","rno":"0004","rnou":"04000","rnu":"0300","robl":"00030","roc":"0200","rocr":"00300","roe":"0040","rofe":"00100","rofil":"005000","rok":"0002","roker":"005000","role_":"500000","romete":"0005000","romi":"00040","romp":"00040","ronal":"000400","rone":"00040","ronis":"005400","ronta":"000400","room":"10000","root":"50000","ropel":"003000","ropic":"000300","rori":"00030","roro":"00500","rosper":"0005000","ross":"00040","rothe":"004000","roty":"00400","rova":"00400","rovel":"000500","rox":"0005","rp":"010","rpea":"04000","rpent":"050000","rper_":"005000","rpet":"03000","rph":"0044","rping":"003000","rpo":"0300","rr":"014","rrec":"00040","rref":"00040","rreo":"04000","rrest":"000400","rrio":"00040","rriv":"00040","rron":"00004","rros":"00004","rrys":"00004","rs":"402","rsa":"0100","rsati":"000500","rsc":"0040","rse":"0200","rsec":"03000","rsecr":"000400","rser_":"005000","rses":"00300","rsev":"00052","rsh":"0100","rsha":"05000","rsi":"0100","rsib":"04040","rson":"00003","rsp":"0100","rsw":"0500","rtach":"000004","rtag":"04000","rteb":"03000","rtend":"000040","rteo":"00050","rti":"0100","rtib":"00500","rtid":"00040","rtier":"040000","rtig":"03000","rtili":"000030","rtill":"000040","rtily":"040000","rtist":"040000","rtiv":"04000","rtri":"03000","rtroph":"0000004","rtsh":"00400","rua":"0030","ruel":"00340","ruen":"00300","rugl":"00400","ruin":"00300","rumpl":"000300","run":"0020","runk":"00005","runty":"000400","rusc":"05000","rutin":"000050","rve":"0040","rveli":"000040","rven":"03000","rver_":"005000","rvest":"050000","rvey":"03000","rvic":"03000","rviv":"00040","rvo":"0300","rw":"010","ryc":"0040","rynge":"500000","ryt":"0030","sa":"002","sab":"2100","sack":"50000","sacri":"000300","sact":"03000","sai":"5000","salar":"000004","salm":"00040","salo":"00500","salt":"00040","sanc":"30000","sande":"000400","sap":"0100","sata":"00500","satio":"503000","satu":"00030","sau":"0004","savor":"005000","saw":"5000","sb":"450","scant":"000045","scap":"00040","scav":"00005","sced":"04000","scei":"40000","sces":"04000","sch":"0002","scho":"04000","scie":"34000","scind":"500040","scle":"00005","scli":"04000","scof":"00004","scopy":"400000","scoura":"0000050","scu":"0100","sd":"450","se_":"4000","sea":"0040","seas":"00004","seaw":"00050","seco":"00230","sect":"30000","sed":"4400","sede":"00440","sedl":"05000","seg":"0020","segr":"00030","sei":"5000","sele":"00100","self":"50000","selv":"50000","seme":"40000","semol":"004000","senat":"000500","senc":"40000","send":"00040","sened":"050000","seng":"00050","senin":"050000","sentd":"400000","sentl":"400000","sepa":"00033","ser_":"41000","serl":"04000","sero":"00040","servo":"400000","ses":"0140","sesh":"00500","sest":"00050","seum":"50500","sev":"5000","seven":"000300","sewi":"00040","sex":"5000","sf":"430","sg":"230","sh":"020","sh_":"2000","sher":"00100","shev":"50000","shin":"00100","shio":"00300","ship":"30000","shiv":"00005","sho":"0004","shold":"005000","shon":"00003","shor":"00004","short":"000005","shw":"4000","sib":"0010","sicc":"05000","side_":"300000","sides":"500000","sidi":"50000","sidiz":"005000","signa":"400000","sile":"00040","sily":"40000","sin":"2100","sina":"02000","sine_":"500000","sing":"03000","sio":"1000","sion":"50000","siona":"000050","sir":"0020","sira":"00050","sis":"1000","sitio":"300000","siu":"5000","siv":"1000","siz":"5000","sk":"002","ske":"4000","sket":"03000","skine":"005000","sking":"005000","sl":"012","slat":"03000","sle":"0200","slith":"000005","sm":"210","sma":"0300","small":"000003","sman":"00003","smel":"00004","smen":"05000","smith":"500000","smold":"000054","sn":"014","so":"100","soce":"00400","soft":"00003","solab":"004000","sold":"00032","solic":"003000","solv":"50000","som":"3000","son_":"34000","sona":"00004","song":"00040","sop":"0400","sophic":"5000000","sophiz":"0500000","sophy":"050000","sorc":"00050","sord":"00050","sov":"4000","sovi":"00500","spa":"2000","spai":"50000","span":"00040","spend":"000040","speo":"25000","sper":"20000","sphe":"02000","spher":"300000","spho":"00005","spil":"00004","sping":"005000","spio":"40000","sply":"04000","spon":"04000","spor":"00004","spot":"40000","squall":"0000040","sr":"010","ss":"200","ssa":"0100","ssas":"00003","ssc":"0250","ssel":"03000","sseng":"050000","sses_":"040000","sset":"05000","ssi":"0100","ssie":"04000","ssier":"000400","ssily":"005000","ssl":"0400","ssli":"00400","ssn":"0400","sspend":"0000004","sst":"0020","ssura":"000050","ssw":"0050","st_":"2000","stag":"02000","stal":"02000","stami":"000040","stand":"500000","stap":"04040","stat_":"500000","sted":"04000","sterni":"0000050","stero":"050000","stew":"00020","stewa":"000050","sthe":"03000","sti":"0020","sti_":"04000","stia":"05000","stic":"01000","stick":"500000","stie":"04000","stif":"03000","sting":"003000","stir":"50000","stle":"01000","stock":"500000","stoma":"000030","stone":"500000","stop":"04000","store":"300000","str":"0040","strad":"040000","stratu":"5000000","stray":"040000","strid":"040000","stry":"40000","stw":"4030","sty":"0200","su":"100","sual":"00100","sub":"0043","sug":"0023","suis":"00500","suit":"00003","sul":"0400","sum":"0020","sumi":"00030","sun":"0020","sur":"0020","sv":"400","sw":"002","swo":"4000","sy":"040","syc":"4000","syl":"3000","syno":"00050","syrin":"005000","ta":"100","ta_":"3000","tab":"2000","tables":"0050000","taboliz":"50000000","taci":"40000","tado":"00500","taf":"4004","tailo":"000500","tal":"0020","tala":"00500","talen":"000500","tali":"00030","talk":"40000","tallis":"0004000","talog":"005000","tamo":"00500","tande":"000400","tanta":"000003","taper":"005000","tapl":"00500","tara":"00040","tarc":"40000","tare":"40000","tariz":"003000","tase":"00040","tasy":"00500","tatic":"400000","tatur":"004000","taun":"00004","tav":"0004","taw":"2000","taxis":"000400","tb":"210","tc":"400","tch":"0400","tchet":"000500","td":"410","te_":"4000","teadi":"000040","teat":"40000","tece":"00004","tect":"50000","ted":"2100","tedi":"00500","tee":"1000","teg":"0004","teger":"005000","tegi":"00500","tel_":"30000","teli":"00004","tels":"50000","tema":"00202","temat":"000300","tenan":"300000","tenc":"30000","tend":"30000","tenes":"400000","tent":"10000","tentag":"0004000","teo":"1000","tep":"0040","tepe":"00500","terc":"00030","terd":"50030","teri":"10000","teries":"0005000","teris":"000300","teriza":"0000500","ternit":"5000000","terv":"00050","tes_":"40000","tess":"40000","tess_":"030000","tethe":"000050","teu":"3000","tex":"3000","tey":"4000","tf":"210","tg":"410","th_":"2000","than":"00004","the":"0020","thea":"40000","theas":"003000","theat":"000500","theis":"000300","thet":"30000","thic_":"005000","thica":"005000","thil":"40000","think":"500000","thl":"4000","thode":"005000","thodic":"5000000","thoo":"40000","thorit":"0000500","thoriz":"0005000","ths":"2000","tia":"1000","tiab":"00400","tiato":"004000","tib":"2020","tick":"40000","tico":"04000","ticu":"04010","tidi":"50000","tien":"30000","tif":"0002","tify":"00500","tig":"2000","tigu":"50000","tillin":"0000500","tim":"1000","timp":"40000","timul":"000500","tin":"2100","tina":"02000","tine_":"300000","tini":"30000","tio":"1000","tioc":"00500","tionee":"0000500","tiq":"5000","tisa":"00300","tise":"30000","tism":"00040","tiso":"00500","tisp":"00040","tistica":"50000000","titl":"00300","tiu":"0040","tiv":"1000","tiva":"00040","tiz":"1000","tiza":"00300","tizen":"003000","tl":"200","tla":"0500","tlan":"00004","tle_":"30000","tled":"30000","tles_":"300000","tlet_":"050000","tlo":"0500","tm":"410","tme":"0004","tn":"212","to":"100","tob":"0030","tocrat":"0050000","todo":"40000","tof":"2000","togr":"00200","toic":"00500","toma":"00200","tomb":"00040","tomy":"00300","tonali":"0004000","tonat":"003000","tono":"40000","tony":"40000","tora":"00200","torie":"003000","toriz":"000500","tos":"0002","tour":"50000","tout":"40000","towar":"003000","tp":"410","tra":"1000","trab":"00030","trach":"000500","traci":"000004","tracit":"0000400","tracte":"0000400","tras":"00004","traven":"0005000","traves":"0000505","tref":"00050","trem":"00040","tremi":"000050","tria":"50000","trices":"0005000","tricia":"5000000","trics":"400000","trim":"20000","triv":"00040","tromi":"000500","troni":"000050","trony":"400000","trophe":"0005000","trosp":"000300","trov":"00030","trui":"00050","trus":"00004","ts":"412","tsc":"0400","tsh":"0004","tsw":"0400","tt":"432","ttes":"04000","tto":"0500","ttu":"0004","tu":"100","tua":"0010","tuar":"00300","tubi":"00400","tud":"0002","tue":"4000","tuf":"4004","tui":"5030","tum":"3000","tunis":"004000","tup_":"23000","ture":"30000","turi":"50000","turis":"000300","turo":"00050","tury":"00500","tus":"3000","tv":"400","tw":"004","twa":"4100","twis":"00004","two":"4000","ty":"100","tya":"4000","tyl":"2000","type":"00003","typh":"00500","tz":"400","tze":"0040","uab":"4000","uac":"0004","uana":"00500","uani":"00040","uarant":"0005000","uard":"00020","uari":"00030","uart":"00030","uat":"0100","uav":"0004","ube":"0040","ubel":"04000","uber":"03000","ubero":"040000","ubi":"0140","ubing":"045000","uble_":"030000","uca":"0300","ucib":"00040","ucit":"00400","ucle":"00003","ucr":"0300","ucu":"0300","ucy":"0400","udd":"0050","uder":"00300","udest":"005000","udev":"00004","udic":"01000","udied":"003000","udies":"003000","udis":"00500","udit":"05000","udon":"04000","udsi":"00400","udu":"0400","uene":"04000","uens":"00004","uente":"000400","ueril":"000400","ufa":"3000","ufl":"0300","ughen":"000300","ugin":"00500","ui":"202","uiliz":"000500","uin":"0040","uing":"01000","uirm":"00040","uita":"00004","uiv":"0003","uiver_":"0004000","uj":"050","uk":"400","ula":"0100","ulab":"00050","ulati":"050000","ulch":"00004","ulche":"500000","ulder":"003000","ule":"0040","ulen":"01000","ulgi":"00400","uli":"0020","ulia":"05000","uling":"003000","ulish":"005000","ullar":"004000","ullib":"004040","ullis":"004000","ulm":"4030","ulo":"0140","uls":"4000","ulses":"000500","ulti":"00100","ultra":"000003","ultu":"40000","ulu":"0300","ulul":"00500","ulv":"0050","umab":"00500","umbi":"00400","umbly":"004000","umi":"0100","uming":"043000","umoro":"000050","ump":"0020","unat":"00004","une":"0200","uner":"00400","uni":"0100","unim":"00400","unin":"02000","unish":"005000","univ":"00030","uns":"0034","unsw":"00400","untab":"000300","unter_":"0040000","untes":"004000","unu":"0004","uny":"0050","unz":"0050","uors":"04000","uos":"0500","uou":"0100","upe":"0100","upers":"000050","upia":"05000","uping":"003000","upl":"0300","upp":"0030","upport":"0000005","uptib":"000500","uptu":"00004","ura":"0100","ura_":"40000","urag":"04000","uras":"04000","urbe":"00400","urc":"0004","urd":"0010","ureat":"000500","urfer":"004000","urfr":"00400","urif":"03000","urific":"0004000","urin":"00100","urio":"03000","urit":"01000","uriz":"00300","url":"0020","urling_":"00050000","urno":"00400","uros":"00004","urpe":"00400","urpi":"00400","urser":"000500","urtes":"005000","urthe":"003000","urti":"00004","urtie":"004000","uru":"0300","us":"200","usad":"05000","usan":"05000","usap":"00400","usc":"0002","usci":"00300","usea":"00050","usia":"05000","usic":"03000","uslin":"004000","usp":"0010","ussl":"00500","ustere":"0050000","ustr":"00100","usu":"0200","usur":"00004","utab":"00040","utat":"03000","ute_":"40000","utel":"40000","uten":"40000","uteni":"000040","uti":"4120","utiliz":"0005000","utine":"030000","uting":"003000","utiona":"0000050","utis":"04000","utiz":"55000","utl":"0410","utof":"00500","utog":"00050","utomatic":"000500000","uton":"05000","utou":"04000","uts":"0004","uu":"030","uum":"0040","uv":"012","uxu":"0003","uze":"0040","va":"100","va_":"5000","vab":"2140","vacil":"000500","vacu":"00030","vag":"0004","vage":"00400","valie":"005000","valo":"00050","valu":"00010","vamo":"00500","vaniz":"005000","vapi":"00500","varied":"0005000","vat":"3000","ve_":"4000","ved":"4000","veg":"0003","vel_":"03000","velli":"000300","velo":"00400","vely":"04000","venom":"000300","venue":"050000","verd":"04000","vere_":"500000","verel":"040000","veren":"030000","verenc":"0005000","veres":"040000","verie":"000300","vermin":"0000040","verse":"300000","verth":"000300","ves":"0420","ves_":"40000","veste":"000400","vete":"00400","veter":"000300","vety":"00400","viali":"005000","vian":"50000","vide_":"500000","vided":"500000","viden":"430000","vides":"500000","vidi":"50000","vif":"0300","vign":"00500","vik":"0004","vil":"2000","vilit":"500000","viliz":"033000","vin":"0100","vina":"40400","vinc":"02000","vind":"00050","ving":"40000","viol":"00030","vior":"03040","viou":"00100","vip":"0040","viro":"00500","visit":"000300","viso":"00300","visu":"00300","viti":"40000","vitr":"00030","vity":"40000","viv":"3000","vo_":"5000","voi":"0004","vok":"3000","vola":"00400","vole":"05000","volt":"50000","volv":"30000","vomi":"00050","vorab":"000500","vori":"00004","vory":"00400","vota":"00400","votee":"400000","vv":"404","vy":"040","wabl":"05000","wac":"2000","wager":"005000","wago":"00050","wait":"00005","wal_":"05000","wam":"0004","wart":"00040","wast":"00040","wate":"00100","waver":"005000","wb":"010","wearie":"0005000","weath":"000003","wedn":"00040","weet":"00003","weev":"00050","well":"00040","wer":"0100","west":"00003","wev":"0300","whi":"0004","wi":"002","wil":"0002","willin":"0000500","winde":"000400","wing":"00040","wir":"0004","wise":"30000","with":"00003","wiz":"0005","wk":"040","wles":"00400","wlin":"00300","wno":"0400","wo":"102","wom":"0001","woven":"005000","wp":"050","wra":"0004","wri":"0004","writa":"000004","wsh":"0300","wsl":"0040","wspe":"00400","wst":"0540","wt":"400","wy":"004","xa":"010","xace":"00050","xago":"04000","xam":"0003","xap":"0400","xas":"0005","xc":"032","xe":"010","xecuto":"0040000","xed":"0200","xeri":"00040","xero":"00500","xh":"010","xhi":"0002","xhil":"00005","xhu":"0004","xi":"030","xia":"0050","xic":"0050","xidi":"00500","xime":"04000","ximiz":"005000","xo":"030","xob":"0400","xp":"030","xpand":"000040","xpecto":"0000005","xped":"00030","xt":"012","xti":"0300","xu":"010","xua":"0030","xx":"004","yac":"0500","yar":"3004","yat":"0500","yb":"010","yc":"010","yce":"0200","ycer":"00500","ych":"0300","yche":"00040","ycom":"00004","ycot":"00004","yd":"010","yee":"0500","yer":"0100","yerf":"04000","yes":"0004","yet":"0040","ygi":"0500","yh":"430","yi":"010","yla":"0300","yllabl":"0000500","ylo":"0300","ylu":"0500","ymbol":"000005","yme":"0004","ympa":"00003","ynchr":"003000","ynd":"0050","yng":"0050","ynic":"00500","ynx":"5000","yo":"014","yod":"0050","yog":"0450","yom":"0004","yonet":"005000","yons":"04000","yos":"0400","yped":"04000","yper":"00005","ypi":"0030","ypo":"0300","ypoc":"04000","ypta":"00200","ypu":"0500","yram":"00050","yria":"00500","yro":"0300","yrr":"0040","ysc":"0040","yse":"0320","ysica":"003000","ysio":"00300","ysis":"30000","yso":"0400","yss":"0004","yst":"0010","ysta":"00300","ysur":"00004","ythin":"030000","ytic":"00300","yw":"010","za":"001","zab":"0520","zar":"0002","zb":"400","ze":"200","zen":"0040","zep":"0040","zer":"0100","zero":"00300","zet":"0004","zi":"210","zil":"0400","zis":"0400","zl":"500","zm":"400","zo":"100","zom":"0040","zool":"00500","zte":"0004","zz":"412","zzy":"0400"};
Hyphenator.updatePatternsLoadState('en',true);

// run the hyphenator
Hyphenator.hyphenateDocument();

