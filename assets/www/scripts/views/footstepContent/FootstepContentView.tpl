<section class="slide content">
	<article>
		{{#if is_found}}
		<img src="img/blaeu.jpg">
		
		<h1>{{footstep_title}}</h1>
		<b>Locatie</b>
		<b>Informatie {{location}}/5</b>
		<p>{{content}}</p>
		{{else}}
			<p>Deze QR-code is nog niet gevonden</p>
		{{/if}}		
		<section>
			<a href="#">Locatie</a>
			<section id="pagination-content-container">

			</section>
		</section>


		
	</article>
</section>