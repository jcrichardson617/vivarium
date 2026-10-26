-- Weight-for-age comparison for one animal against a group the keeper picks:
-- same species, same species and sex, same visual morph, or morph and sex.
--
-- Peers' weights are aggregated by month of age (one averaged weight per
-- animal per month, so a keeper who weighs weekly doesn't count four times).
-- A month is only returned when it has at least 5 animals from at least 3
-- keepers, so no single keeper's animals can be read back from the band and
-- tiny groups don't produce a misleading range. The group totals come back
-- either way so the page can say how far short a narrow group is.
create or replace function public.weight_comparison(p_animal_id uuid, p_group text)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
    v_species uuid;
    v_sex text;
    v_hatch date;
    v_morph text[];
    v_result jsonb;
begin
    if p_group not in ('species', 'sex', 'morph', 'morph_sex') then
        raise exception 'unknown comparison group %', p_group;
    end if;
    if not private.can_view_animal(p_animal_id) then
        return null;
    end if;

    select a.species_id, a.sex, a.hatch_date into v_species, v_sex, v_hatch
    from public.animals a where a.id = p_animal_id;
    if v_species is null then
        return null;
    end if;
    if p_group in ('sex', 'morph_sex') and v_sex not in ('male', 'female') then
        return null;
    end if;

    -- Visual morph: the genes the animal shows (visual or super), hets ignored.
    select coalesce(array_agg(ag.gene_id::text || ':' || ag.status order by ag.gene_id, ag.status), '{}')
    into v_morph
    from public.animal_genes ag
    where ag.animal_id = p_animal_id and ag.status in ('visual', 'super');

    with peers as (
        select a.id, o.user_id as keeper, a.hatch_date
        from public.animals a
        left join public.animal_ownership o on o.animal_id = a.id and o.is_current_owner
        where a.species_id = v_species
          and a.id <> p_animal_id
          and a.hatch_date is not null
          and (p_group in ('species', 'morph') or a.sex = v_sex)
          and (p_group in ('species', 'sex') or v_morph = (
                select coalesce(array_agg(g.gene_id::text || ':' || g.status order by g.gene_id, g.status), '{}')
                from public.animal_genes g
                where g.animal_id = a.id and g.status in ('visual', 'super')))
    ),
    monthly as (
        select p.id, p.keeper,
               floor((w.recorded_at::date - p.hatch_date) / 30.4375)::int as age_month,
               avg(w.weight_grams) as g
        from peers p
        join public.weight_logs w on w.animal_id = p.id
        where w.recorded_at::date >= p.hatch_date
        group by 1, 2, 3
    ),
    bins as (
        select age_month,
               count(*) as n,
               percentile_cont(0.25) within group (order by g) as p25,
               percentile_cont(0.5) within group (order by g) as p50,
               percentile_cont(0.75) within group (order by g) as p75
        from monthly
        group by age_month
        having count(*) >= 5 and count(distinct keeper) >= 3
    )
    select jsonb_build_object(
        'animals', (select count(distinct id) from monthly),
        'keepers', (select count(distinct keeper) from monthly),
        'hatch_date', v_hatch,
        'bins', coalesce((select jsonb_agg(jsonb_build_object(
                    'age_month', age_month, 'n', n,
                    'p25', round(p25::numeric, 1), 'p50', round(p50::numeric, 1), 'p75', round(p75::numeric, 1))
                  order by age_month) from bins), '[]'::jsonb)
    ) into v_result;
    return v_result;
end;
$$;

revoke all on function public.weight_comparison(uuid, text) from public, anon;
grant execute on function public.weight_comparison(uuid, text) to authenticated;
