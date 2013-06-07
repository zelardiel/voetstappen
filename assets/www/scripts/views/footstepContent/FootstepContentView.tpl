<section class="slide content footstep-content" data-location="{{location}}">
	<article id="contentcontainer" class="piece-of-content voetstapcontent" data-location="{{location}}">
		<img src="img/blaeu.jpg">

		{{#if is_found}}
		
		<h1>{{footstep_title}}</h1>
		<b>Informatie {{location}}/5</b>
		<p>{{content}}</p>

		{{else}}
			<h1>Nog te ontdekken..</h1>
			<b>Informatie {{location}}/5</b>
			<p>Dit stukje informatie is nog vergrendeld. Zoek in de buurt van de huidige voetstap naar QR-codes</p>

		{{/if}}		
 		<b id="prev-arr">
		</b>

		<b id="next-arr">
		</b>
	</article>
</section>

<script type="text/javascript">touchScroll('contentcontainer');</script>