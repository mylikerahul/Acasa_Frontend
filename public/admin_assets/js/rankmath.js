$(document).ready(function() {
	// Title count and indicator
	var s_title = $('#seo_title').val();
	var count = s_title.replace(/\s+/g, '').length; 
	var persent = (count * 100) / 60;
	$('#title_indicator .length-indicator span').css('left', persent + '%'); 
	$('#title_indicator .current_count').text(count);
	if(s_title == ''){
		$('#title_indicator').addClass('invalid');
	}else{
		$('#title_indicator').removeClass('invalid');
	}
	CKEDITOR.instances.editor1.on("change", function() {
		cke_editor_onchange(this.getData());
	});
	$('#seo_title').keyup(function () {
		var count = $(this).val().replace(/\s+/g, '').length; 
		var persent = (count * 100) / 60;
		$('#title_indicator .length-indicator span').css('left', persent + '%'); 
		$('#title_indicator .current_count').text(count);
		if(count > 0){
			$('#title_indicator').removeClass('invalid');
		}else{
			$('#title_indicator').addClass('invalid');
		}
		var seo_keywork = $('#seo_keywork').val();
		var keywords = seo_keywork.split(',');
		show_alert(keywords,$(this).val(), 'check_title');
	}); 
	// permalink count and indicator
	var s_slug = $('#slug').val();
	var count = s_slug.replace(/\s+/g, '').length; 
	var persent = (count * 100) / 75;
	$('#slug_indicator .length-indicator span').css('left', persent + '%'); 
	$('#slug_indicator .current_count').text(count);
	if(s_slug == ''){
		$('#slug_indicator').addClass('invalid');
	}else{
		$('#slug_indicator').removeClass('invalid');
	}
	$('#slug').keyup(function () { 
		var count = $(this).val().replace(/\s+/g, '').length; 
		var persent = (count * 100) / 75;
		$('#slug_indicator .length-indicator span').css('left', persent + '%'); 
		$('#slug_indicator .current_count').text(count);
		if(count > 0){
			$('#slug_indicator').removeClass('invalid');
		}else{
			$('#slug_indicator').addClass('invalid');
		}
		var seo_keywork = $('#seo_keywork').val();
		var keywords = seo_keywork.split(',');
		show_alert(keywords,$(this).val(), 'check-url');
	}); 
	// Meta Description count and indicator
	var s_desc = $('#seo_description').text();
	var count = s_desc.replace(/\s+/g, '').length; 
	var persent = (count * 100) / 160;
	$('#desc_indicator .length-indicator span').css('left', persent + '%'); 
	$('#desc_indicator .current_count').text(count);
	if(s_desc == ''){
		$('#desc_indicator').addClass('invalid');
	}else{
		$('#desc_indicator').removeClass('invalid');
	}
	$('#seo_description').keyup(function () { 
		var count = $(this).val().replace(/\s+/g, '').length; 
		var persent = (count * 100) / 160;
		$('#desc_indicator .length-indicator span').css('left', persent + '%'); 
		$('#desc_indicator .current_count').text(count);
		if(count > 0){
			$('#desc_indicator').removeClass('invalid');
		}else{
			$('#desc_indicator').addClass('invalid');
		}
		var seo_keywork = $('#seo_keywork').val();
		var keywords = seo_keywork.split(',');
		show_alert(keywords,$(this).val(), 'check-desc');
	}); 
	// Meta Keyword count and indicator
	var seo_keywork = $('#seo_keywork').val();
	var ss= seo_keywork.replace(/,/g, "");
	var count = ss.replace(/\s+/g, '').length; 
	var persent = (count * 100) / 100;
	$('#keword_indicator .length-indicator span').css('left', persent + '%'); 
	$('#keword_indicator .current_count').text(count);

	$('#seo_keywork').on('change', function(event) {
		alert('hello');
		var $element = $(event.target);
		var $container = $element.closest('.tags_contains');
		if (!$element.data('tagsinput'))
		  return;
		var val = $element.val();
		if (val === null)
		val = "null";
		var string = $.isArray(val) ? JSON.stringify(val) : val;
		var ss= string.replace(/,/g, "");
		var count = ss.replace(/\s+/g, '').length; 
		var persent = (count * 100) / 100;
		$('#keword_indicator .length-indicator span').css('left', persent + '%'); 
		$('#keword_indicator .current_count').text(count);
		var keywords = val.split(',');
		var content_description = $('#content_description').text();
		var s_title = $('#seo_title').val();
		//s_title = s_title.toLowerCase();
		var s_slug = $('#slug').val();
		//s_slug = s_slug.replace(/-/g, ' ').toLowerCase();
		var s_desc = $('#seo_description').text();
		//s_desc = s_desc.toLowerCase();
		show_alert(keywords,s_title, 'check_title');
		show_alert(keywords,s_slug, 'check-url');
		show_alert(keywords,s_desc, 'check-desc');
		show_alert(keywords,content_description, 'check-content');
		var desc_count = content_description.replace(/\s+/g, '').length; 
		$('.desc_cou').html(desc_count);
		if(desc_count > 250){
			$('.check-content-count .check-fail').addClass('hidden');
			$('.check-content-count .check-pass').removeClass('hidden');
		}else{
			$('.check-content-count .check-fail').removeClass('hidden');
			$('.check-content-count .check-pass').addClass('hidden');
		}
	}).trigger('change');	
	
	function show_alert(keywords,item, check_class){
		var i, j=0;
		for(i = 0; i < keywords.length; ++i){
			var key = keywords[i];
			var key1 = key.toLowerCase().replace(/\b[a-z]/g, function(letter) {
				return letter.toUpperCase();
			});
			if((item.indexOf(key) != -1) || (item.indexOf(key1) != -1)){
				if(keywords[i] !=''){
					j= 1;
					//alert('found '+ keywords[i] + ' in '+ item);
				}
			}
		}
		if(j == 1){
			$('.'+check_class+' .check-fail').addClass('hidden');
			$('.'+check_class+' .check-pass').removeClass('hidden');
		}else{
			$('.'+check_class+' .check-fail').removeClass('hidden');
			$('.'+check_class+' .check-pass').addClass('hidden');
		}
	}	
	function cke_editor_onchange(content_description){
		var desc_count = content_description.replace(/\s+/g, '').length; 
		$('.desc_cou').html(desc_count);
		if(desc_count > 250){
			$('.check-content-count .check-fail').addClass('hidden');
			$('.check-content-count .check-pass').removeClass('hidden');
		}else{
			$('.check-content-count .check-fail').removeClass('hidden');
			$('.check-content-count .check-pass').addClass('hidden');
		}
		var seo_keywork = $('#seo_keywork').val();
		var keywords = seo_keywork.split(',');
		show_alert(keywords,content_description, 'check-content');
	}
});
