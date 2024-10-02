(function(){

	// element
	const modeSelectModal = new bootstrap.Modal('#modeSelect', {});
	modeSelectModal.show();
	var invalidToast = new bootstrap.Toast($('#invalidToast'), {});

	var game = {
		status: 0,
		keyword: null,
		mode: null,
		guessWords: [],
	};

	function getCell(i, div=null){
		if(div==null){
			return $('#answer-div div[data-pos="'+i+'"]');
		}else{
			return $('div[data-pos="'+i+'"]', div);
		}
	}
	var dictionary1 = null;
	var dictionary2 = null;

	// initialize dictionary
	$.ajax({
		url: './word1',
		success: function(data){
			dictionary1 = data.split(' ');
		}
	})
	$.ajax({
		url: './word2',
		success: function(data){
			dictionary2 = data.split(' ');
		}
	})


	$('.mode-select-btn').click(function(){
		modeSelectModal.hide();
		startGame($(this).data('mode'));
	})

	function startGame(mode){
		game.status = 1;
		game.mode = mode;
		game.keyword = dictionary1[Math.floor(Math.random()*dictionary1.length)];
		$('#modeName').text(mode);
		if(mode=="lying"){
			$('.lying-hint').show()
		}else if(mode=="cyclic"){
			let pos=Math.floor(Math.random()*5);
			game.keyword = game.keyword.substring(pos)+game.keyword.substring(0,pos);
		}else if(mode=="double" || mode=="triple" || mode=="puppet"){
			$('#word-selection').show();
			$('.answer-box').addClass('colored-'+mode).attr('data-show', 'all');
			$('.keyboard-key').addClass('colored-'+mode).attr('data-show', 'all');
			game.keyword2 = dictionary1[Math.floor(Math.random()*dictionary1.length)];
			if(mode=="triple"){
				$('#word-selection [data-word="3"]').show();
				game.keyword3 = dictionary1[Math.floor(Math.random()*dictionary1.length)];
			}
		}else if(mode == "mixing"){
			// shuffling
			game.mixingDict = [-1,-1,-1];
			game.mixingDict[0] = Math.floor(Math.random()*3);
			game.mixingDict[1] = (game.mixingDict[0]+Math.floor(Math.random()*2)+1)%3;
			game.mixingDict[2] = (3-game.mixingDict[0]-game.mixingDict[1])%3;
			$('#mixingPanel').show();
		}
	}

	function getWord(div=null){
		let word = "";
		for(let i=1; i<=5; i++){
			let char = getCell(i, div).text();
			if(char.length == 0){
				return null;
			}
			word += char;
		}
		return word;
	}

	function check(word, guess){
		if(game.mode == "flipping"){
			let temp = word;
			word = guess;
			guess = temp;
		}
		let cw = [0, 0, 0, 0, 0];
		let cg = [0, 0, 0, 0, 0];
		verdict = [0, 0, 0, 0, 0];
		for(let i=0; i<5; i++){
			if(word.charAt(i) == guess.charAt(i)){
				cw[i] = 1;
				cg[i] = 1;
				verdict[i] = 1;
			}
		}
		for(let i=0; i<5; i++){
			for(let j=0; j<5; j++){
				if(cw[i] != 0 || cg[j] != 0){
					continue
				}
				if(word.charAt(i) == guess.charAt(j)){
					cw[i] = 1;
					cg[j] = 1;
					verdict[j] = 2;
				}
			}
		}
		if(game.mode == 'lying' && word!=guess){
			let lying = Math.random()>0.5;
			if(lying){
				for(let i=0; i<5; i++){
					if(Math.random()>0.5){
						verdict[i] = (verdict[i]+1)%3;
					}else{
						verdict[i] = (verdict[i]+2)%3;
					}
				}
			}
		}
		return verdict;
	}

	function setKeyboard(guess, hint, option={}){
		let wordId = option.word ?? 1;
		if(game.mode=="lying"){
			if(!option['truth'] || option['truth']=="unknown") return;
			if(option['truth']=="lie"){

				let fakeReply = [-1,-1,-1,-1,-1];
				for(let i=0; i<5; i++){
					if(parseInt(hint[i])==0){
						fakeReply[i]=2;
					}
				}
				hint = fakeReply;
			}
		}else if(game.mode=="flipping"){
			let reply = [-1,-1,-1,-1,-1];
			for(let i=0; i<5; i++){
				if(parseInt(hint[i])==1){
					// green stays green
					reply[i]=1;
				}else{
					let presence = false;
					for(let j=0; j<5; j++){
						if(i==j) continue;
						if(parseInt(hint[j])==2){
							// Other place yellow
							presence = true;
							break;
						}
					}
					if(!presence){
						reply[i]=0;
					}
				}
			}
			hint = reply;
		}else if(game.mode=="mixing"){
			return;
		}
		guess = guess.toUpperCase();
		for(let i=0; i<5; i++){
			let key = $('.keyboard-key[data-key="'+guess[i]+'"]');
			if(parseInt(hint[i]) == 0){
				if(key.css('--color'+wordId) != 'green' && key.css('--color'+wordId) != 'yellow'){
					key.addClass('colored')
					   .css('--color'+wordId, 'grey')
					   .attr('data-transparent'+wordId, true);
				}
			}else if(parseInt(hint[i]) == 1){
				key.addClass('colored').css('--color'+wordId, 'green');
			}else if(parseInt(hint[i]) == 2){
				if(key.css('--color'+wordId) != 'green'){
					key.addClass('colored').css('--color'+wordId, 'yellow');
				}
			}
		}
	}

	function submitWord(){
		let guessWord = getWord().toLowerCase();
		if(guessWord === null){
			return;
		}
		// Check word validity
		if(game.mode != "cyclic"){
			if(!dictionary2.includes(guessWord)){
				$('#alert-message').text('Not in word list.');
				invalidToast.show();
				return;
			}else{
				invalidToast.hide();
			}
		}else{
			let wordValid = false;
			for(let i=0; i<5; i++){
				let cyclic = guessWord.substring(i)+guessWord.substring(0,i);
				if(dictionary2.includes(cyclic)){
					wordValid = true;
					break;
				}
			}
			if(!wordValid){
				$('#alert-message').text('Not in word list.');
				invalidToast.show();
				return;
			}else{
				invalidToast.hide();
			}
		}
		// Check for fixing
		if(game.mode == "fixing" && game.guessWords.length > 0){
			let lastGuess = game.guessWords[game.guessWords.length-1];
			let yellows = [];
			for(let i=0; i<5; i++){
				if(lastGuess.hint[i] == 2){
					yellows.push(lastGuess.word[i]);
				}
			}
			for(let i=0; i<5; i++){
				let pos = yellows.indexOf(guessWord[i])
				if(pos != -1){
					yellows.splice(pos, 1);
				}
			}
			if(yellows.length != 0){
				$('#alert-message').text('In FIXING mode, you need to have same letters as previous green in the exact same position before, and have same letters as previous yellow in random position.')
				invalidToast.show();
				return;
			}else{
				invalidToast.hide();
			}
		}

		// Accept Word

		let oldDiv = $("#answer-div");
		$(".answer-box", oldDiv).removeClass('active');
		let newDiv = oldDiv.clone(true);

		let verdict = check(game.keyword, guessWord);
		let verdict2, verdict3;
		if(game.mode == "double"){
			verdict2 = check(game.keyword2, guessWord);
			if(game.correct1){
				verdict = [1,1,1,1,1];
			}
			if(game.correct2){
				verdict2 = [1,1,1,1,1];
			}
		}
		if(game.mode == "triple"){
			verdict2 = check(game.keyword2, guessWord);
			verdict3 = check(game.keyword3, guessWord);
			if(game.correct1){
				verdict = [1,1,1,1,1];
			}
			if(game.correct2){
				verdict2 = [1,1,1,1,1];
			}
			if(game.correct3){
				verdict3 = [1,1,1,1,1];
			}
		}

		let allCorrect = false;
		if(game.mode == "double"){
			if(game.keyword==guessWord){
				game.correct1 = true;
				for(let key of $('.keyboard-key')){
					if(guessWord.toUpperCase().includes($(key).data('key'))){
						$(key).css('--color1', 'green');
					}else{
						$(key).css('--color1', 'grey')
							  .attr('data-transparent1',true);
					}
				}
			}
			if(game.keyword2==guessWord){
				game.correct2 = true;
				for(let key of $('.keyboard-key')){
					if(guessWord.toUpperCase().includes($(key).data('key'))){
						$(key).css('--color2', 'green');
					}else{
						$(key).css('--color2', 'grey')
							  .attr('data-transparent2',true);
					}
				}
			}
			if(game.correct1 && game.correct2){
				allCorrect = true;
			}
		}else if(game.mode == "triple"){
			if(game.keyword==guessWord){
				game.correct1 = true;
				for(let key of $('.keyboard-key')){
					if(guessWord.toUpperCase().includes($(key).data('key'))){
						$(key).css('--color1', 'green');
					}else{
						$(key).css('--color1', 'grey')
							  .attr('data-transparent1',true);
					}
				}
			}
			if(game.keyword2==guessWord){
				game.correct2 = true;
				for(let key of $('.keyboard-key')){
					if(guessWord.toUpperCase().includes($(key).data('key'))){
						$(key).css('--color2', 'green');
					}else{
						$(key).css('--color2', 'grey')
							  .attr('data-transparent2',true);
					}
				}
			}
			if(game.keyword3==guessWord){
				game.correct3 = true;
				for(let key of $('.keyboard-key')){
					if(guessWord.toUpperCase().includes($(key).data('key'))){
						$(key).css('--color3', 'green');
					}else{
						$(key).css('--color3', 'grey')
							  .attr('data-transparent3',true);
					}
				}
			}
			if(game.correct1 && game.correct2 && game.correct3){
				allCorrect = true;
			}
		}else{
			allCorrect = (game.keyword==guessWord);
		}

		let colorArray = ['grey', 'green', 'yellow'];

		for(let i=1; i<=5; i++){
			let cell = getCell(i);
			if(game.mode == "meteorite" && !allCorrect){
				if(Math.random()>0.75){
					cell.addClass('meteorite');
					verdict[i-1] = -1;
					continue;
				}
			}
			if(game.mode == "mixing"){
				verdict[i-1] = game.mixingDict[verdict[i-1]];
			}
			
			// Give color
			setTimeout(function(){
				cell.attr('data-animation', 'flip-in');

				setTimeout(function(){

					if(verdict[i-1] >= 0){
						cell.addClass('colored')
								  .css('--color1',colorArray[verdict[i-1]]);
					}

					if(game.mode == "double"){
						let displayMode = $('.word-filter.active').data('word');
						if(verdict2[i-1] >= 0){
							cell.css('--color2',colorArray[verdict2[i-1]]);
						}
					}else if(game.mode == "triple"){
						let displayMode = $('.word-filter.active').data('word');
						if(verdict2[i-1] >= 0){
							cell.css('--color2',colorArray[verdict2[i-1]]);
						}
						if(verdict3[i-1] >= 0){
							cell.css('--color3',colorArray[verdict3[i-1]]);
						}
					}
					cell.attr('data-animation', 'flip-out');
				}, 400);
			}, (i-1)*300);
		}

		game.guessWords.push({"word":guessWord, "hint":verdict});

		oldDiv.attr('id', '');
		if(allCorrect) return;

		$('div[data-pos]', newDiv).empty();
		$('div[data-pos=1]', newDiv).addClass('active');
		$('#hint-div').append(newDiv);
		// $(".answer-box", newDiv).click(clickFocus);
		wordPos = 1;
		$("#hint-div").scrollTop($("#hint-div")[0].scrollHeight);
		if(!game.correct1)
			setKeyboard(guessWord, verdict);
		if(game.mode == "lying"){
			$('.lying-hint', oldDiv).css('visibility', 'visible');
			$('.lying-hint', oldDiv).data('reply', verdict.join(''));
		}else if(game.mode == "not"){
			$('.keyboard-key').removeClass('not');
			for(let i=0; i<5; i++){
				$('.keyboard-key[data-key="'+guessWord[i].toUpperCase()+'"]').addClass('not');
			}
		}else if(game.mode == "fixing"){
			for(let i=0; i<5; i++){
				if(verdict[i]==1){
					getCell(i+1).addClass("fixing")
								.text(guessWord[i].toUpperCase())
								.addClass("answer-g");
				}
			}
		}else if(game.mode == "double"){
			if(!game.correct2)
				setKeyboard(guessWord, verdict2, {'word': 2});
		}else if(game.mode == "triple"){
			if(!game.correct2)
				setKeyboard(guessWord, verdict2, {'word': 2});
			if(!game.correct3)
				setKeyboard(guessWord, verdict3, {'word': 3});
		}
		if(getCell(1).hasClass('fixing')){
			gotoNextCell();
		}
	}

	// Events
	function gotoPrevCell(){
		let lastWordPos = wordPos;
		if(wordPos>=2){
			wordPos--;
			while(getCell(wordPos).hasClass("fixing")){
				wordPos--;
				if(wordPos<1){
					wordPos = lastWordPos;
					break;
				}
			}
			$('#answer-div div[data-pos="'+lastWordPos+'"]').removeClass('active');
			$('#answer-div div[data-pos="'+wordPos+'"]').addClass('active');
		}
	}
	function gotoNextCell(){
		let lastWordPos = wordPos;
		if(wordPos<5){
			wordPos++;
			while(getCell(wordPos).hasClass("fixing")){
				wordPos++;
				if(wordPos>5){
					wordPos = lastWordPos;
					break;
				}
			}
			$('#answer-div div[data-pos="'+lastWordPos+'"]').removeClass('active');
			$('#answer-div div[data-pos="'+wordPos+'"]').addClass('active');
		}
	}
	function inputChar(char){
		if($('.keyboard-key[data-key="'+char.toUpperCase()+'"]').hasClass('not')){
			$('.keyboard-key[data-key="'+char.toUpperCase()+'"]').addClass('shaking');
			setTimeout(() => {
			$('.keyboard-key[data-key="'+char.toUpperCase()+'"]').removeClass('shaking')}, 820);
			return;
		}
		if (wordPos<=5) {
			$('#answer-div div[data-pos="'+wordPos+'"]').text(char.toUpperCase());

			gotoNextCell();
		}
	}
	function backspace(){
		if($('#answer-div div[data-pos="'+wordPos+'"]').text() != ''){
			$('#answer-div div[data-pos="'+wordPos+'"]').text('');
			$('#answer-div div[data-pos="'+(wordPos+1)+'"]').removeClass('active');
			$('#answer-div div[data-pos="'+wordPos+'"]').addClass('active');
		}else if(wordPos>=2){
			gotoPrevCell();
			$('#answer-div div[data-pos="'+wordPos+'"]').text('');
		}
	}
	var wordPos = 1;

	$('.keyboard-key[data-key]').click(function(){
		inputChar($(this).data("key"));
	});
	$('#backspace-btn').click(backspace);
	$(document).on('keypress', function(e){
		if (event.keyCode >= 65 && event.keyCode <= 90) {
		    // Alphabet upper case
		} else if (event.keyCode >= 97 && event.keyCode <= 122) {
		    // Alphabet lower case
		} else {
			return;
		}
		if (e.which !== 0 && wordPos<=5) {
			inputChar(String.fromCharCode(e.which));
		}
	});

	$(document).on('keydown', function(e){
		if (e.keyCode==8){
			backspace();
		}else if(e.keyCode == 13){
			submitWord();
		}else if(e.keyCode == 32 || e.keyCode == 39){
			gotoNextCell();
		}else if(e.keyCode == 37){
			gotoPrevCell();
		}
	});

	function clickFocus(){
		if($(this).closest("#answer-div").length==0) return;
		if($(this).hasClass("fixing")) return;
		$(".answer-box").removeClass('active');
		$(this).addClass('active');
		wordPos = parseInt($(this).data('pos'));
	}

	$("#answer-div .answer-box").click(clickFocus);

	$('#submit-btn').click(submitWord);

	
	$('.lying-hint-btn').click(function(){
		$(this).siblings('.lying-hint-btn').removeClass('active');
		$(this).addClass('active');
		$(".keyboard-key").removeClass('colored')
				  		  .attr('data-transparent1', null)
				  		  .attr('style', null);
		for(let lyingHint of $('.lying-hint')){
			let word = getWord($(lyingHint).closest('.guess-div'));
			let hint = $('.active', lyingHint).data('hint');
			let reply = $(lyingHint).data('reply');
			if(word==null || reply===undefined) continue;
			setKeyboard(word, reply, {"truth":hint});
		}
	});
	$('.word-filter').click(function(){
		$('.word-filter').removeClass('active');
		$(this).addClass('active');
		if(game.mode == "double" || game.mode == "triple"){
			let filter = $(this).data('word');
			if(filter == "all"){
				$('[data-show]').attr('data-show', 'all');
			}else{
				$('[data-show]').attr('data-show', 'word'+filter);
			}
		}
	})

	$('.colorSelect').click(function(e){
		$('#colorSelector').show();
		$('.colorSelect').removeClass('active');
		$(this).addClass('active');
		e.stopPropagation();
	})
	$('#colorSelector .colorBox').click(function(e){
		// no change
		if($('.colorSelect.active').attr('data-color') == $(this).data('color')) return;
		console.log($('.colorSelect.active').attr('data-color'), $(this).data('color'));


		let sameColor = $('.colorSelect[data-color="'+$(this).data('color')+'"]');

		$('.colorSelect.active').attr("data-color", $(this).data('color'));
		
		// Check same color
		if(sameColor.length > 0 && $(this).data('color') != "unknown"){
			if($('.colorSelect[data-color="unknown"]').length > 0){
				sameColor.attr('data-color', 'unknown');
			}else{
				for(let c of ['black', 'yellow', 'green']){
					if($('.colorSelect[data-color="'+c+'"]').length == 0){
						sameColor.attr('data-color', c);
						break;
					}
				}
			}
		}

		$('.colorSelect').removeClass('active');
		$('#colorSelector').hide();
	});
	$(document).click(function(e){
		var container = $("#colorSelector");
 
	    // If the target of the click isn't the container
	    if(!container.is(e.target) && container.has(e.target).length === 0){
			$('.colorSelect').removeClass('active');
			$('#colorSelector').hide();
	    }
	});

})();
