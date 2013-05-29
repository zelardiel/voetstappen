<section class="slide content">
	<article class="piece-of-content voetstapcontent" data-location="{{location}}">
		{{#if is_found}}
		<img src="img/blaeu.jpg">
		
		<h1>{{footstep_title}}</h1>
		<b>Locatie</b>
		<b>Informatie {{location}}/5</b>
		<p>{{content}}</p>
		{{else}}
			<b>Informatie {{location}}/5</b>
			<p>Deze QR-code is nog niet gevonden</p>
		{{/if}}		
		<section>
			<a href="#">Locatie</a>
			<section id="pagination-content-container">

			</section>
		</section>


		
	</article>
</section>