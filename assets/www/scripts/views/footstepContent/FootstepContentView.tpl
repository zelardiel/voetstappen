<section class="slide content footstep-content" data-location="{{location}}">
	<article id="contentcontainer" class="piece-of-content voetstapcontent" data-location="{{location}}">
		<img src="img/blaeu.jpg">

		{{#if is_found}}
		
		<h1>{{footstep_title}}</h1>
		<b>Informatie {{location}}/5</b>
		<p>{{content}}</p>

		{{else}}
			<h1>Te ontdekken..</h1>
			<b>Informatie {{location}}/5</b>
			<p>Deze QR-code is nog niet gevonden</p>

		{{/if}}		
	</article>
</section>
<script type="text/javascript" src="scripts/libs/touchscroll2.js"></script>