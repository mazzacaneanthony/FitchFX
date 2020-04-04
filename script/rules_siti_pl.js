// SI/TI RULE CHECKING FUNCTIONS (LSL ONLY)
// ========================================

// Main SI checking function
function ckSI(l,n) {
	var flag = '[ERROR applying '+gRul(l.rul)+' to line(s) '+l.lin.join(',')+']: ';

	if(n==0) { // fill remaining line attributes
		if(l.seq.length==1) { // treat theorems special because they may begin a proof
			l.sig = !PROOF.length ? [0] : PROOF[l.cnt-2].sig.slice(0);
			l.dth = l.sig.length;
			l.avl = gtAvl(l);
			l.frv = freeVars(l.tr);
		} else {fillND(l);}
	}
	console.log(l.lin, l.seq);
	if(l.lin.length!=(l.seq.length-1)) {
		throw flag+'The rule is being applied to an inappropriate number of lines.';
	}

	if(l.seq.length==1) { // for theorems e.g. TI(LEM)
		var x = match(parse(l.seq[0]),l.tr); // try to match line to sequent
		if(!x[0]) {nope();} // match failed
		if(clash(x[1])) {nope();} // dictionary returned by match is improper
	}
	if(l.seq.length==2) {
		var x = match(parse(l.seq[0]),PROOF[l.lin[0]-1].tr);
		if(!x[0]) {nope();}
		var y = match(parse(l.seq[1]),l.tr);
		if(!y[0]) {nope();}
		if(clash(x[1].concat(y[1]))) {nope();}
	}
	if(l.seq.length==3) {
		var x = match(parse(l.seq[0]),PROOF[l.lin[0]-1].tr);
		if(!x[0]) {nope();}
		var y = match(parse(l.seq[1]),PROOF[l.lin[1]-1].tr);
		if(!y[0]) {nope();}
		var z = match(parse(l.seq[2]),l.tr);
		if(!z[0]) {nope();}
		if(clash(x[1].concat(y[1],z[1]))) {nope();}
	}

	x = areAvl(l.lin,l.avl);
	if(x>=0) {
		throw flag+'Rule line '+x+' is not available at this stage of the proof.  The following lines are available: '+l.avl.join(',');
	}
	function nope() {
		throw flag+'The formula being derived does not follow by '+gRul(l.rul)+'.';
	}
}

// Checks bi-directional, i.e. equivalence, SI rules (DeM, Imp, NegImp, Dist) except DN
function ckSIbi(l,n) {
	var flag = '[ERROR applying '+gRul(l.rul)+' to line '+l.lin.join(',')+']: ';
	if(n==0) {fillND(l);}
	if(l.lin.length!=1) {
		throw flag+'The rule is being applied to an inappropriate number of lines.';
	}

	var m1 = match(parse(l.seq[0]),l.tr); // tests if target formula matches first part of sequent
	if(!m1[0]) {// if not
		m1 = match(parse(l.seq[1]),l.tr); // match target formula to second part of sequent
		var m2 = match(parse(l.seq[0]),PROOF[l.lin-1].tr); // match source formula to first part of sequent
	} else {var m2 = match(parse(l.seq[1]),PROOF[l.lin-1].tr);} // if yes, match source formula to second part of sequent
	if(!m1[0] || !m2[0]){nope();}
	if(clash(m1[1].concat(m2[1]))) {nope();}

	x = areAvl(l.lin,l.avl);
	if(x>=0) {
		throw flag+'Rule line '+x+' is not available at this stage of the proof.  The following lines are available: '+l.avl.join(',');
	}
	function nope() {
		throw flag+'The formula being derived does not follow by '+l.rul+'.';
	}
}

// Checks SI(DN)
function ckDNbi(l,n) {
	var flag = '[ERROR applying '+gRul(l.rul)+' to line '+l.lin.join(',')+']: ';
	if(n==0) {fillND(l);}

	if(l.lin.length!=1) {
		throw flag+'Rule must be applied to one line.';
	}
	if(!(l.frm != '~~'+PROOF[l.lin[0]-1].frm) && !('~~'+l.frm != PROOF[l.lin[0]-1].frm)) {
		throw flag+'The formula on line '+l.lin[0]+' must be the double negation of the formula being derived, or vice versa.';
	}
	x = areAvl(l.lin,l.avl);
	if(x>=0) {
		throw flag+'Rule line '+x+' is not available at this stage of the proof.  The following lines are available: '+l.avl.join(',');
	}
}

// Checks SI(Com)
function ckCOM(l,n) {
	var flag = '[ERROR applying '+gRul(l.rul)+' to line(s) '+l.lin.join(',')+']: ';

	if(l.lin.length!=1){
		throw flag+'The rule is being applied to an inappropriate number of lines.';
	}

	var cn = ['&','v','<>'];
	var c1 = l.tr[1]; // main binary connective in input line
	var c2 = PROOF[l.lin-1].tr[1]; // main binary connective in rule line
	if(c1==undefined || c2==undefined || c1!=c2) {throw flag+'The formula being derived does not follow by '+gRul(l.rul)+'.'}
	if(cn.indexOf(c1)<0) {throw flag+c1+' is not a commutative connective.';}

	l.seq = l.seq.map(function(x) {return x.replace("*",c1);});
	ckSI(l,n);
}


// Checks SI(SDN1)
function ckSDN1(l,n) {
	var flag = '[ERROR applying '+gRul(l.rul)+' to line '+l.lin.join(',')+']: ';
	if(n==0) {fillND(l);}

	if(l.lin.length!=1) {
		throw flag+'The rule is being applied to an inappropriate number of lines.';
	}
	var c = l.tr[1]; // main binary connective
	var c2 = PROOF[l.lin[0]-1].tr[1]; // main binary connective in formula on rule line
	if(c==undefined || c2==undefined || c!=c2) {nope();}

	var templates = ['(A'+c+'B)','(~~A'+c+'B)','(A'+c+'~~B)','(~~A'+c+'~~B)'];
	var dmatch = get_match(templates,l.tr); // will hold the match for the formula on the rule line
	var fmatch = get_match(templates,PROOF[l.lin[0]-1].tr); // will hold the match for the formula being derived
	if(!fmatch[0] || !dmatch[0]) {nope();}
	if(clash(fmatch[1].concat(dmatch[1]))) {nope();}

	x = areAvl(l.lin,l.avl);
	if(x>=0) {
		throw flag+'Rule line '+x+' is not available at this stage of the proof.  The following lines are available: '+l.avl.join(',');
	}
	function nope() {
		throw flag+'The formula being derived does not follow by '+l.rul+'.';
	}
}

// Checks SI(SDN2)
function ckSDN2(l,n) {
	var flag = '[ERROR applying '+gRul(l.rul)+' to line '+l.lin.join(',')+']: ';
	if(n==0) {fillND(l);}

	if(l.lin.length!=1) {
		throw flag+'The rule is being applied to an inappropriate number of lines.';
	}
	var c = l.tr[1][1]; // main binary connective
	var c2 = PROOF[l.lin[0]-1].tr[1][1]; // main binary connective in formula on rule line
	if(c==undefined || c2==undefined || c!=c2 || l.tr[0]!='~' || PROOF[l.lin[0]-1].tr[0]!='~') {nope();}

	var templates = ['~(A'+c+'B)','~(~~A'+c+'B)','~(A'+c+'~~B)','~(~~A'+c+'~~B)'];
	var dmatch = get_match(templates,l.tr); // will hold the match for the formula on the rule line
	var fmatch = get_match(templates,PROOF[l.lin[0]-1].tr); // will hold the match for the formula being derive
	if(!fmatch[0] || !dmatch[0]) {nope();}
	if(clash(fmatch[1].concat(dmatch[1]))) {nope();}

	x = areAvl(l.lin,l.avl);
	if(x>=0) {
		throw flag+'Rule line '+x+' is not available at this stage of the proof.  The following lines are available: '+l.avl.join(',');
	}
	function nope() {
		throw flag+'The formula being derived does not follow by '+l.rul+'.';
	}
}

// Helper for ckSDN1 and ckSDN2.  Takes an array of templates and a tree and tries
// matching the tree to each of the templates.  Returns the match() output if there
// is a match and an empty array [] otherwise.
function get_match(templates,tree) {
	var m = [false,[]];
	for(var i=0;i<templates.length;i++) {
		var x = match(parse(templates[i]),tree);
		if(x[0]) {m = x;}
	}
	return m;
}


// String -> [String]
// Extracts the SI sequent (as an array) from the 'value' attribute of the selected
// rule (see the html <option> elements).  E.g. from 'SI(MT):(A>B),~B,~A' will return
// ['(A>B)','~B','~A']
function getSeq(s) {
	var o = '';
	var i = 0;
	if(s.indexOf(':')<0) {return [];}
	while(s[i]!=':') {i++;}
	o = s.substr(i+1);
	o = o.replace(/ /g,'');
	return o.split(',');
}

// String -> String
// Extracts the SI rule name (as string) from the 'value' attribute of the selected
// rule.  E.g. from 'SI(MT):(A>B),~B,~A' will return 'SI(MT)'.
function getSeqHead(s) {
	var o = '';
	var i = 0;
	if(s.indexOf(':')<0) {return s;}
	while(s[i]!=':') {i++;}
	return s.substr(0,i);
}

// (Tree,Tree) -> [Boolean,Dictionary]
// Takes two trees,t1 and t2, where t1 is a "template" and t2 is to be matched
// against that template.  Returns an array with the first element 'true' if
// t2 matches the template, and the second element a "dictionary" of the matches.
// Returns an array with the first element 'false' if t2 doesn't match the template.
// E.g. if the template is "(A&B)", it will match any t2 that is a conjunction, and
// give a dictionary with 'A' assigned to the first conjunct of t2 and 'B' assigned
// to the second conjunct of t2.  So match(parse("(A&B)"),parse("((F>G)&D)")) will
// return [true,[['A','(F>G)'],['B','D']]].
function match(t1,t2) {
	var a = ['A','B','C'];
	var out = [];
	function foo(x,y) {
		for(var i=0;i<x.length;i++) {
			if(x[i] instanceof Array && y[i] instanceof Array) {
				if(!foo(x[i],y[i])) {return false;}
			} else if(a.indexOf(x[i])>=0) {
				out.push([a[a.indexOf(x[i])],unparse(y)]);
			} else if (x[i]!=y[i]) {return false;}
		}
		return true;
	}
	var t = foo(t1,t2);
	if(t) {t=!clash(out);}
	return t ? [t,out] : [t,[]];
}

// Dictionary -> Boolean
// Checks a "dictionary" element of the match function to see if there are any clashes,
// where a clash occurs if the dictionary matches a certain template variable to different
// strings.  If there is a clash it returns 'true', if not it returns 'false'. E.g.
// [['A','F>G'],['A','D']] contains a clash, but [['A','F>G'],['A','F>G']] does not.
function clash(ar) {
	var a1 = ar[0];
	ar = ar.slice(1);
	if(ar.length==0) {return false;}
	for(var i=0;i<ar.length;i++) {
		if(ar[i][0]==a1[0] && ar[i][1]!=a1[1]) {
			return true;
		}
	}
	return clash(ar);
}
