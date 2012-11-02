/**
 * This file contains additional predefined functions and some sample snippets for TSLisp.
 */


module TSLisp
{
	export var PRELUDE = 
		"(setq defmacro\n" +
		"      (macro (name args &rest body)\n" +
		"			  `(progn (setq ,name (macro ,args ,@body))\n" +
		"					  ',name)))\n\n" +
		"(defmacro defun (name args &rest body)\n" +
		"  `(progn (setq ,name (lambda ,args ,@body))\n" +
		"			',name)))\n\n" +
		"(defun caar (x) (car (car x)))\n" +
		"(defun cadr (x) (car (cdr x)))\n" +
		"(defun cdar (x) (cdr (car x)))\n" +
		"(defun cddr (x) (cdr (cdr x)))\n" +
		"(defun caaar (x) (car (car (car x))))\n" +
		"(defun caadr (x) (car (car (cdr x))))\n" +
		"(defun cadar (x) (car (cdr (car x))))\n" +
		"(defun caddr (x) (car (cdr (cdr x))))\n" +
		"(defun cdaar (x) (cdr (car (car x))))\n" +
		"(defun cdadr (x) (cdr (car (cdr x))))\n" +
		"(defun cddar (x) (cdr (cdr (car x))))\n" +
		"(defun cdddr (x) (cdr (cdr (cdr x))))\n" +
		"(defun not (x) (eq x nil))\n" +
		"(defun consp (x) (not (atom x)))\n" +
		"(defun print (x) (prin1 x) (terpri) x)\n" +
		"(defun identity (x) x)\n\n" +
		"(setq\n" +
		"= eql\n" +
		"null not\n" +
		"setcar replaca\n" +
		"setcdr replacd)\n\n" +
		"(defun > (x y) (< y x))\n" +
		"(defun >= (x y) (not (< x y)))\n" +
		"(defun <= (x y) (not (< y x)))\n" +
		"(defun /= (x y) (not (= x y)))\n" +
		"(setq <> /=)\n\n" +
		"(defun equal (x y)\n" +
		"  (cond ((atom x) (eql x y))\n" +
		"		 ((equal (car x) (car y)) (equal (cdr x) (cdr y)))))\n\n" +
		"(defun concat (&rest x)\n" +
		"  (cond ((null x) \"\")\n" +
		"		 ((null (cdr x)) (_concat (car x)))\n" +
		"		 (t (_add (_concat (car x))\n" +
		"				  (apply concat (cdr x))))))\n\n" +
		"(defmacro if (test then &rest else)\n" +
		"  `(cond (,test ,then)\n" +
		"         ,@(cond (else `((t ,@else))))))\n\n" +
		"(defmacro when (test &rest body)\n" +
		"  `(cond (,test ,@body)))\n\n" +
		"(defmacro let (args &rest body)\n" +
		"  ((lambda (vars vals)\n" +
		"     (defun vars (x)\n" +
		"       (cond (x (cons (if (atom (car x))\n" +
		"                          (car x)\n" +
		"                        (caar x))\n" +
		"                      (vars (cdr x))))))\n" +
		"     (defun vals (x)\n" +
		"       (cond (x (cons (if (atom (car x))\n" +
		"                          nil\n" +
		"                        (cadar x))\n" +
		"                      (vals (cdr x))))))\n" +
		"     `((lambda ,(vars args) ,@body) ,@(vals args)))\n" +
		"   nil nil))\n\n" +
		"(defun _append (x y)\n" +
		"  (if (null x)\n" +
		"      y\n" +
		"    (cons (car x) (_append (cdr x) y))))\n" +
		"(defmacro append (x &rest y)\n" +
		"  (if (null y)\n" +
		"      x\n" +
		"    `(_append ,x (append ,@y))))\n\n" +
		"(defmacro and (x &rest y)\n" +
		"  (if (null y)\n" +
		"      x\n" +
		"    `(cond (,x (and ,@y)))))\n\n" +
		"(defmacro or (x &rest y)\n" +
		"  (if (null y)\n" +
		"      x\n" +
		"    `(cond (,x)\n" +
		"           ((or ,@y)))))\n\n" +
		"(defun listp (x)\n" +
		"  (or (null x) (consp x)))    ; NB (listp (lambda (x) (+ x 1))) => nil\n\n" +
		"(defun memq (key x)\n" +
		"  (cond ((null x) nil)\n" +
		"        ((eq key (car x)) x)\n" +
		"        (t (memq key (cdr x)))))\n\n" +
		"(defun member (key x)\n" +
		"  (cond ((null x) nil)\n" +
		"        ((equal key (car x)) x)\n" +
		"        (t (member key (cdr x)))))\n\n" +
		"(defun assq (key alist)\n" +
		"  (cond (alist (let ((e (car alist)))\n" +
		"                 (if (and (consp e) (eq key (car e)))\n" +
		"                     e\n" +
		"                   (assq key (cdr alist)))))))\n\n" +
		"(defun assoc (key alist)\n" +
		"  (cond (alist (let ((e (car alist)))\n" +
		"                 (if (and (consp e) (equal key (car e)))\n" +
		"                     e\n" +
		"                   (assoc key (cdr alist)))))))\n\n" +
		"(defun _nreverse (x prev)\n" +
		"  (let ((next (cdr x)))\n" +
		"    (setcdr x prev)\n" +
		"    (if (null next)\n" +
		"        x\n" +
		"      (_nreverse next x))))\n" +
		"(defun nreverse (list)            ; (nreverse '(a b c d)) => (d c b a)\n" +
		"  (cond (list (_nreverse list nil))))\n\n" +
		"(defun last (list)\n" +
		"  (if (atom (cdr list))\n" +
		"      list\n" +
		"    (last (cdr list))))\n\n" +
		"(defun nconc (&rest lists)\n" +
		"  (if (null (cdr lists))\n" +
		"      (car lists)\n" +
		"    (setcdr (last (car lists))\n" +
		"            (apply nconc (cdr lists)))\n" +
		"    (car lists)))\n\n" +
		"(defmacro push (newelt listname)\n" +
		"  `(setq ,listname (cons ,newelt ,listname)))\n\n" +
		"(defmacro pop (listname)\n" +
		"  `(let (($a (car ,listname)))\n" +
		"     (setq ,listname (cdr ,listname))\n" +
		"     $a))\n\n" +
		"(defmacro while (test &rest body)\n" +
		"  `(let ($loop)\n" +
		"     (setq $loop (lambda () (cond (,test ,@body ($loop)))))\n" +
		"     ($loop)))\n\n" +
		"(defun nth (n list)\n" +
		"  (while (< 0 n)\n" +
		"    (setq list (cdr list)\n" +
		"          n (- n 1)))\n" +
		"  (car list))\n\n" +
		"(defmacro dolist (spec &rest body) ; (dolist (name list [result]) body...)\n" +
		"  (let ((name (car spec)))\n" +
		"	`(let (,name\n" +
		"			($list ,(cadr spec)))\n" +
		"		(while $list\n" +
		"		  (setq ,name (car $list))\n" +
		"		  ,@body\n" +
		"		  (setq $list (cdr $list)))\n" +
		"		,@(if (cddr spec)\n" +
		"			 `((setq ,name nil)\n" +
		"				,(caddr spec))))))\n\n" +
		"(defmacro dotimes (spec &rest body) ; (dotimes (name count [result]) body...)\n" +
		"  (let ((name (car spec)))\n" +
		"    `(let ((,name 0)\n" +
		"           ($count ,(cadr spec)))\n" +
		"       (while (< ,name $count)\n" +
		"         ,@body\n" +
		"         (setq ,name (+ ,name 1)))\n" +
		"       ,@(if (cddr spec)\n" +
		"             `(,(caddr spec))))))\n\n" +
		"(defun reduce (f x)\n" +
		"  (if (null x)\n" +
		"      (f)\n" +
		"    (let ((r (car x)))\n" +
		"      (setq x (cdr x))\n" +
		"      (while x\n" +
		"        (setq r (f r (car x))\n" +
		"              x (cdr x)))\n" +
		"      r)))\n\n" +
		"(defun some (f x)\n" +
		"  (cond ((null x) nil)\n" +
		"        ((f (car x)))\n" +
		"        (t (some f (cdr x)))))\n\n" +
		"(defun take (n x)                       ; Haskell\n" +
		"  (if (or (= 0 n) (null x))\n" +
		"      nil\n" +
		"    (cons (car x) (take (- n 1) (cdr x)))))\n\n" +
		"(defun drop (n x)                       ; Haskell\n" +
		"  (if (or (= 0 n) (null x))\n" +
		"      x\n" +
		"    (drop (- n 1) (cdr x))))\n\n" +
		"(defun _zip (x)\n" +
		"  (if (some null x)\n" +
		"      nil\n" +
		"    (let ((cars (mapcar car x))\n" +
		"          (cdrs (mapcar cdr x)))\n" +
		"      (cons cars ~(_zip cdrs)))))\n" +
		"(defun zip (&rest x) (_zip x))          ; Python 3.0 & Haskell\n\n" +
		"(defun range (m n)                      ; Python 3.0\n" +
		"  (cond ((< m n) (cons m ~(range (+ m 1) n)))))\n\n" +
		"(defun map (f x)                        ; Haskell\n" +
		"  (cond (x (cons ~(f (car x)) ~(map f (cdr x))))))\n" +
		"(defun mapf (f x)                       ; map force\n" +
		"  (cond (x (cons (f (car x)) ~(map f (cdr x))))))\n\n" +
		"(defun scanl (f q x)                    ; Haskell\n" +
		"  (cons q ~(cond (x (scanl f (f q (car x)) (cdr x))))))\n\n" +
		"(defun filter (f x)                     ; Haskell & Python 3.0\n" +
		"  (cond ((null x) nil)\n" +
		"        ((f (car x)) (cons (car x) ~(filter f (cdr x))))\n" +
		"        (t (filter f (cdr x)))))\n";

	export var PRIMES = 
		"(setq primes\n" +
		"  (let (p s n)\n" +
		"    (defun p (l)\n" +
		"      (cons (car l)\n" +
		"            ~(p ((s (car l))\n" +
		"                 (cdr l)))))\n\n" +
		"    (defun s (p)\n" +
		"      (let (sp)\n" +
		"        (defun sp (l)\n" +
		"          (if (= (% (car l) p) 0)\n" +
		"              (sp (cdr l))\n" +
		"            (cons (car l)\n" +
		"                  ~(sp (cdr l)))))\n" +
		"        sp))\n\n" +
		"    (defun n (x)\n" +
		"      (cons x ~(n (+ x 1))))\n\n" +
		"    (p (n 2))))\n";
	
	export var FIBS = 
		"(setq fibs\n" +
		"      (cons 1 (cons 1 ~(mapf (lambda (x) (apply + x))\n" +
		"                             (zip fibs (cdr fibs))))))\n";
}